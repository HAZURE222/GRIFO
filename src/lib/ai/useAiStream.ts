'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_ERRORS, AiErrorCode, AiEvent, AiRequest } from './types';

export type AiStatus = 'idle' | 'streaming' | 'done' | 'stopped' | 'error';

export function useAiStream() {
  const [status, setStatus] = useState<AiStatus>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const reset = useCallback(() => {
    controller.current?.abort();
    setStatus('idle');
    setText('');
    setError(null);
    setTruncated(false);
  }, []);

  const stop = useCallback(() => {
    controller.current?.abort();
    setStatus('stopped');
  }, []);

  const run = useCallback(async (request: AiRequest): Promise<string | null> => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setStatus('streaming');
    setText('');
    setError(null);
    setTruncated(false);

    const fail = (code: AiErrorCode) => {
      setError(AI_ERRORS[code]);
      setStatus('error');
      return null;
    };

    let full = '';
    try {
      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: abort.signal,
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { code?: AiErrorCode } | null;
        return fail(payload?.code ?? 'unknown');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AiEvent;
          if (event.t === 'text') {
            full += event.v;
            setText(full);
          } else if (event.t === 'done') {
            finished = true;
            setTruncated(event.truncated);
          } else if (event.t === 'error') {
            return fail(event.code);
          }
        }
      }
      if (!finished) return fail('network');
      setStatus('done');
      return full;
    } catch (err) {
      if (abort.signal.aborted) return null;
      return fail(err instanceof TypeError ? 'network' : 'unknown');
    }
  }, []);

  return { status, text, error, truncated, run, stop, reset };
}
