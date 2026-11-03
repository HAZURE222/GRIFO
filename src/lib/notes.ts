import { Subject, Topic } from './data/types';

const WIKILINK = /\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;

export const normalizeTitle = (title: string) => title.trim().toLocaleLowerCase('pt-BR');

export function extractLinks(content: string): string[] {
  return Array.from(new Set(Array.from(content.matchAll(WIKILINK), (m) => m[1].trim())));
}

export function findByTitle(topics: Topic[], title: string): Topic | undefined {
  const wanted = normalizeTitle(title);
  return topics.find((t) => normalizeTitle(t.title) === wanted);
}

export function backlinks(note: Topic, topics: Topic[]): Topic[] {
  const own = normalizeTitle(note.title);
  return topics.filter((t) => t.id !== note.id && extractLinks(t.content).some((l) => normalizeTitle(l) === own));
}

export const WIKI_PREFIX = '#wiki:';
export const MARK_HREF = '#grifo';

function transformProse(text: string) {
  return text
    .replace(WIKILINK, (_, title: string, alias?: string) => `[${(alias ?? title).trim()}](${WIKI_PREFIX}${encodeURIComponent(title.trim())})`)
    .replace(/==(?=\S)([^\n]+?)(?<=\S)==/g, (_, inner: string) => `[${inner.replace(/([[\]])/g, '\\$1')}](${MARK_HREF})`);
}

export function toMarkdown(content: string): string {
  return content
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 ? part : transformProse(part)))
    .join('');
}

export type GraphNode = { id: string; label: string; kind: 'subject' | 'note'; color: Subject['color']; degree: number; x: number; y: number };
export type GraphEdge = { from: string; to: string; kind: 'member' | 'link' };

export function buildGraph(subjects: Subject[], topics: Topic[], width: number, height: number) {
  const colorOf = new Map(subjects.map((s) => [s.id, s.color]));
  const nodes: GraphNode[] = [
    ...subjects.map((s) => ({ id: s.id, label: s.name, kind: 'subject' as const, color: s.color, degree: 0, x: 0, y: 0 })),
    ...topics.map((t) => ({ id: t.id, label: t.title, kind: 'note' as const, color: colorOf.get(t.subjectId) ?? 'amarelo', degree: 0, x: 0, y: 0 })),
  ];
  const edges: GraphEdge[] = topics.map((t) => ({ from: t.subjectId, to: t.id, kind: 'member' }));
  for (const t of topics) {
    for (const title of extractLinks(t.content)) {
      const target = findByTitle(topics, title);
      if (target && target.id !== t.id) edges.push({ from: t.id, to: target.id, kind: 'link' });
    }
  }

  const index = new Map(nodes.map((n, i) => [n.id, i]));
  nodes.forEach((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 * 3.1;
    const radius = 40 + i * 6;
    n.x = width / 2 + Math.cos(angle) * radius;
    n.y = height / 2 + Math.sin(angle) * radius;
  });
  for (const e of edges) {
    const a = nodes[index.get(e.from) ?? -1];
    const b = nodes[index.get(e.to) ?? -1];
    if (a && b && e.kind === 'link') {
      a.degree += 1;
      b.degree += 1;
    }
  }

  const repulsion = 16000;
  for (let step = 0; step < 320; step += 1) {
    const cooling = 1 - step / 320;
    const fx = new Float64Array(nodes.length);
    const fy = new Float64Array(nodes.length);
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].x - nodes[j].x || 0.1;
        const dy = nodes[i].y - nodes[j].y || 0.1;
        const d2 = Math.max(dx * dx + dy * dy, 64);
        const force = repulsion / d2;
        const d = Math.sqrt(d2);
        fx[i] += (dx / d) * force;
        fy[i] += (dy / d) * force;
        fx[j] -= (dx / d) * force;
        fy[j] -= (dy / d) * force;
      }
    }
    for (const e of edges) {
      const i = index.get(e.from);
      const j = index.get(e.to);
      if (i === undefined || j === undefined) continue;
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const d = Math.hypot(dx, dy) || 1;
      const rest = e.kind === 'member' ? 70 : 130;
      const pull = (d - rest) * (e.kind === 'member' ? 0.09 : 0.025);
      fx[i] += (dx / d) * pull;
      fy[i] += (dy / d) * pull;
      fx[j] -= (dx / d) * pull;
      fy[j] -= (dy / d) * pull;
    }
    nodes.forEach((n, i) => {
      fx[i] += (width / 2 - n.x) * 0.012;
      fy[i] += (height / 2 - n.y) * 0.018;
      n.x += Math.max(-18, Math.min(18, fx[i])) * cooling;
      n.y += Math.max(-18, Math.min(18, fy[i])) * cooling;
    });
  }
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (const n of nodes) {
    n.x = maxX > minX ? 90 + ((n.x - minX) / (maxX - minX)) * (width - 180) : width / 2;
    n.y = maxY > minY ? 36 + ((n.y - minY) / (maxY - minY)) * (height - 84) : height / 2;
  }
  return { nodes, edges };
}
