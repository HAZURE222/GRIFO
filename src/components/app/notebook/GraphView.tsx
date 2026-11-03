'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { buildGraph, GraphNode } from '@/lib/notes';
import { useStudy } from '../StudyProvider';
import { Swatch, useTipHandlers } from '../ui';

const WIDTH = 960;
const HEIGHT = 620;

function Node({ node, dimmed, onHover, onOpen }: { node: GraphNode; dimmed: boolean; onHover: (id: string | null) => void; onOpen: () => void }) {
  const isSubject = node.kind === 'subject';
  const radius = isSubject ? 11 : 5 + Math.min(node.degree, 4);
  const showLabel = isSubject || node.degree >= 3;
  const tip = useTipHandlers(isSubject ? 'matéria' : `${node.degree} ${node.degree === 1 ? 'ligação' : 'ligações'}`, node.label);
  return (
    <g
      className={`graph-node ${dimmed ? 'is-dim' : ''} ${isSubject ? 'is-subject' : ''}`}
      transform={`translate(${node.x} ${node.y})`}
      role={isSubject ? undefined : 'link'}
      tabIndex={isSubject ? undefined : 0}
      aria-label={isSubject ? undefined : `Abrir ${node.label}`}
      onPointerEnter={() => onHover(node.id)}
      onPointerLeave={() => {
        onHover(null);
        tip.onPointerLeave();
      }}
      onPointerMove={tip.onPointerMove}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      onClick={isSubject ? undefined : onOpen}
      onKeyDown={(e) => {
        if (!isSubject && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <circle r={Math.max(radius, 14)} fill="transparent" />
      <circle r={radius} style={{ fill: `var(--hl-${node.color})`, stroke: 'var(--paper)' }} strokeWidth={2} />
      {showLabel && (
        <text y={radius + 14} textAnchor="middle" className={isSubject ? 'graph-label graph-label--strong' : 'graph-label'}>
          {node.label}
        </text>
      )}
    </g>
  );
}

export function GraphView() {
  const router = useRouter();
  const { subjects, topics } = useStudy();
  const [hover, setHover] = useState<string | null>(null);

  const signature = useMemo(() => JSON.stringify([subjects.map((s) => [s.id, s.name, s.color]), topics.map((t) => [t.id, t.title, t.subjectId, t.content.length])]), [subjects, topics]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const graph = useMemo(() => buildGraph(subjects, topics, WIDTH, HEIGHT), [signature]);

  const position = new Map(graph.nodes.map((n) => [n.id, n]));
  const neighbors = useMemo(() => {
    if (!hover) return null;
    const set = new Set([hover]);
    for (const e of graph.edges) {
      if (e.from === hover) set.add(e.to);
      if (e.to === hover) set.add(e.from);
    }
    return set;
  }, [hover, graph.edges]);
  const links = graph.edges.filter((e) => e.kind === 'link').length;

  return (
    <section className="graph" aria-labelledby="mapa-titulo">
      <header className="graph-head">
        <h1 id="mapa-titulo">Mapa do caderno</h1>
        <p>
          {topics.length} {topics.length === 1 ? 'nota' : 'notas'}, {links} {links === 1 ? 'ligação' : 'ligações'}. Clique em uma nota para abrir.
        </p>
      </header>
      {topics.length ? (
        <>
          <div className="graph-canvas">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label="Mapa de notas ligadas">
              {graph.edges.map((e, i) => {
                const a = position.get(e.from);
                const b = position.get(e.to);
                if (!a || !b) return null;
                const active = neighbors ? e.from === hover || e.to === hover : false;
                return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`graph-edge graph-edge--${e.kind} ${active ? 'is-active' : ''} ${neighbors && !active ? 'is-dim' : ''}`} />;
              })}
              {graph.nodes.map((n) => (
                <Node key={n.id} node={n} dimmed={Boolean(neighbors && !neighbors.has(n.id))} onHover={setHover} onOpen={() => router.push(`/caderno?nota=${n.id}`)} />
              ))}
            </svg>
          </div>
          <ul className="legend">
            {subjects.map((s) => (
              <li key={s.id}>
                <Swatch color={s.color} />
                {s.name}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="quiet-note">O mapa aparece quando houver notas. Peça o primeiro resumo.</p>
      )}
    </section>
  );
}
