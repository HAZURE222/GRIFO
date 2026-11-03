import { NextRequest, NextResponse } from 'next/server';
import { buildUserPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { AI_LIMITS, AiErrorCode, AiEvent, AiRequest } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const MODES = ['resumir', 'encurtar', 'simplificar', 'perguntas'];
const DEPTHS = ['curto', 'padrao', 'detalhado'];
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}

function parse(body: unknown): AiRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
  if (!MODES.includes(b.mode as string)) return null;
  if (!text(b.subject, AI_LIMITS.subject) || !text(b.topic, AI_LIMITS.topic) || !(b.topic as string).trim()) return null;
  if (b.depth !== undefined && !DEPTHS.includes(b.depth as string)) return null;
  if (b.material !== undefined && !text(b.material, AI_LIMITS.material)) return null;
  if (b.note !== undefined && !text(b.note, AI_LIMITS.note)) return null;
  if (b.linkTitles !== undefined) {
    if (!Array.isArray(b.linkTitles) || b.linkTitles.length > AI_LIMITS.links) return null;
    if (!b.linkTitles.every((t) => text(t, AI_LIMITS.topic))) return null;
  }
  if (b.mode !== 'resumir' && !(b.note as string | undefined)?.trim()) return null;
  return b as unknown as AiRequest;
}

function statusCode(status: number): AiErrorCode {
  if (status === 401 || status === 403) return 'bad-key';
  if (status === 429) return 'rate';
  if (status === 400 || status === 404 || status === 422) return 'invalid';
  return status >= 500 ? 'overloaded' : 'unknown';
}

/* Alguns modelos abrem a resposta com o raciocínio entre <think> e </think>; a nota recebe só o texto final. */
function thinkFilter() {
  let buffer = '';
  let state: 'start' | 'thinking' | 'text' = 'start';
  return (chunk: string) => {
    if (state === 'text') return chunk;
    buffer += chunk;
    if (state === 'start') {
      const head = buffer.trimStart();
      if ('<think>'.startsWith(head)) return '';
      if (!head.startsWith('<think>')) {
        state = 'text';
        return head;
      }
      state = 'thinking';
    }
    const close = buffer.indexOf('</think>');
    if (close < 0) return '';
    state = 'text';
    return buffer.slice(close + '</think>'.length).trimStart();
  };
}

const refuse = (code: AiErrorCode, status: number) => NextResponse.json({ code }, { status });

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return refuse('invalid', 403);
  if (!process.env.NVIDIA_API_KEY) return refuse('no-key', 503);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (limited(ip)) return refuse('rate', 429);

  const parsed = parse(await req.json().catch(() => null));
  if (!parsed) return refuse('invalid', 400);

  const encoder = new TextEncoder();
  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AiEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const upstream = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            stream: true,
            ...(model.startsWith('nvidia/nemotron') ? { chat_template_kwargs: { enable_thinking: false } } : null),
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildUserPrompt(parsed) },
            ],
          }),
          signal: req.signal,
        });
        if (!upstream.ok || !upstream.body) {
          console.error('Falha na rota de IA: NVIDIA respondeu', upstream.status);
          send({ t: 'error', code: statusCode(upstream.status) });
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const filter = thinkFilter();
        let buffer = '';
        let finish: string | null = null;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            const choice = JSON.parse(data).choices?.[0];
            const text = choice?.delta?.content ? filter(choice.delta.content) : '';
            if (text) send({ t: 'text', v: text });
            finish = choice?.finish_reason ?? finish;
          }
        }
        if (finish === 'content_filter') send({ t: 'error', code: 'refused' });
        else send({ t: 'done', truncated: finish === 'length' });
      } catch (error) {
        if (!req.signal.aborted) {
          console.error('Falha na rota de IA:', error instanceof Error ? error.message : error);
          send({ t: 'error', code: error instanceof TypeError ? 'network' : 'unknown' });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* o cliente já encerrou a conexão */
        }
      }
    },
  });

  return new Response(body, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } });
}
