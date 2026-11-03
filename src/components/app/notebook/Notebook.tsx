'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { CaretDown, GraphIcon, MagnifyingGlass, PencilSimple, Plus, Sparkle, Trash } from '@phosphor-icons/react';
import { Highlighter, Subject } from '@/lib/data';
import { today } from '@/lib/dates';
import { normalizeTitle } from '@/lib/notes';
import { useStudy } from '../StudyProvider';
import { ColorPicker, Dialog, useUI } from '../ui';
import { GraphView } from './GraphView';
import { NoteView } from './NoteView';
import { SummarizeForm } from './SummarizeForm';
import './notebook.css';

export function SubjectDialog({ title, initialName, initialColor, onClose, onSave }: { title: string; initialName: string; initialColor: Highlighter; onClose: () => void; onSave: (name: string, color: Highlighter) => Promise<unknown> }) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  return (
    <Dialog title={title} onClose={onClose}>
      <form
        className="dialog-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await onSave(name.trim(), color);
          onClose();
        }}
      >
        <label className="field">
          <span>Nome da matéria</span>
          <input className="input" value={name} maxLength={60} required autoFocus onChange={(e) => setName(e.target.value)} />
        </label>
        <ColorPicker value={color} onChange={setColor} name="cor-materia" />
        <div className="dialog-actions">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Salvar
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function SubjectBranch({ subject, activeId, filter, onNew }: { subject: Subject; activeId: string | null; filter: string; onNew: (subjectId: string) => void }) {
  const { topics, updateSubject, removeSubject, reviews } = useStudy();
  const { confirm } = useUI();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const day = today();

  const all = topics.filter((t) => t.subjectId === subject.id);
  const shown = filter ? all.filter((t) => normalizeTitle(t.title).includes(filter) || normalizeTitle(t.content).includes(filter)) : all;
  if (filter && !shown.length) return null;
  const expanded = open || Boolean(filter) || all.some((t) => t.id === activeId);

  return (
    <li className="branch" style={{ '--tab': `var(--hl-${subject.color})` } as React.CSSProperties}>
      <div className="branch-head">
        <button type="button" className="branch-toggle" aria-expanded={expanded} onClick={() => setOpen(!expanded)}>
          <CaretDown aria-hidden="true" className={expanded ? 'is-open' : ''} />
          <span className="branch-swatch" aria-hidden="true" />
          <span className="branch-name">{subject.name}</span>
          <span className="branch-count">{all.length}</span>
        </button>
        <button type="button" className="tree-action" aria-label={`Nova nota em ${subject.name}`} title="Nova nota" onClick={() => onNew(subject.id)}>
          <Plus aria-hidden="true" />
        </button>
        <button type="button" className="tree-action" aria-label={`Editar ${subject.name}`} title="Editar matéria" onClick={() => setEditing(true)}>
          <PencilSimple aria-hidden="true" />
        </button>
        <button
          type="button"
          className="tree-action"
          aria-label={`Excluir ${subject.name}`}
          title="Excluir matéria"
          onClick={async () => {
            const ok = await confirm({ title: `Excluir ${subject.name}?`, body: 'Notas, sessões e revisões desta matéria serão apagadas.', action: 'Excluir matéria' });
            if (ok) removeSubject(subject.id);
          }}
        >
          <Trash aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <ul className="branch-notes">
          {shown.map((t) => {
            const late = reviews.some((r) => r.topicId === t.id && !r.doneAt && r.dueDate < day);
            return (
              <li key={t.id}>
                <Link href={`/caderno?nota=${t.id}`} className={`tree-note ${t.id === activeId ? 'is-current' : ''} ${t.content ? '' : 'is-empty'}`} aria-current={t.id === activeId ? 'page' : undefined}>
                  <span>{t.title}</span>
                  {late && <span className="tree-late">rever</span>}
                  {t.source === 'ia' && <span className="tree-ia">IA</span>}
                </Link>
              </li>
            );
          })}
          {!filter && !shown.length && <li className="branch-empty">Nenhuma nota ainda.</li>}
        </ul>
      )}
      {editing && (
        <SubjectDialog title="Editar matéria" initialName={subject.name} initialColor={subject.color} onClose={() => setEditing(false)} onSave={(name, color) => updateSubject({ ...subject, name, color })} />
      )}
    </li>
  );
}

function Tree({ activeId, view, onNew }: { activeId: string | null; view: string; onNew: (subjectId: string) => void }) {
  const { subjects, addSubject, nextColor } = useStudy();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const filter = normalizeTitle(query);
  return (
    <aside className="tree" aria-label="Matérias e notas">
      <Link href="/caderno?novo=1" className={`btn btn--primary tree-new ${view === 'novo' ? 'is-current' : ''}`}>
        <Sparkle weight="fill" aria-hidden="true" /> Novo resumo
      </Link>
      <label className="tree-search">
        <MagnifyingGlass aria-hidden="true" />
        <span className="sr-only">Buscar nas notas</span>
        <input type="search" placeholder="Buscar nas notas" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {subjects.length > 0 ? (
        <ul className="tree-list">
          {subjects.map((s) => (
            <SubjectBranch key={s.id} subject={s} activeId={activeId} filter={filter} onNew={onNew} />
          ))}
        </ul>
      ) : (
        <p className="quiet-note">Sua primeira matéria nasce com o primeiro resumo.</p>
      )}
      <div className="tree-foot">
        <button type="button" className="tree-link" onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" /> Nova matéria
        </button>
        <Link href="/caderno?mapa=1" className={`tree-link ${view === 'mapa' ? 'is-current' : ''}`}>
          <GraphIcon aria-hidden="true" /> Mapa do caderno
        </Link>
      </div>
      {creating && <SubjectDialog title="Nova matéria" initialName="" initialColor={nextColor()} onClose={() => setCreating(false)} onSave={addSubject} />}
    </aside>
  );
}

function NewNoteDialog({ subjectId, onClose }: { subjectId: string; onClose: () => void }) {
  const { createNote, subjects } = useStudy();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const subject = subjects.find((s) => s.id === subjectId);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const id = await createNote({ subjectId, title, content: '', source: 'manual' });
    onClose();
    router.push(`/caderno?nota=${id}&editar=1`);
  };
  return (
    <Dialog title={`Nova nota em ${subject?.name ?? 'matéria'}`} onClose={onClose}>
      <form className="dialog-stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Título</span>
          <input className="input" value={title} maxLength={120} required autoFocus onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="dialog-actions">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Criar nota
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function Notebook() {
  const params = useSearchParams();
  const { topics } = useStudy();
  const [newIn, setNewIn] = useState<string | null>(null);

  const noteId = params.get('nota');
  const note = useMemo(() => topics.find((t) => t.id === noteId) ?? null, [topics, noteId]);
  const view = note ? 'nota' : params.get('mapa') ? 'mapa' : params.get('novo') ? 'novo' : 'inicio';

  return (
    <div className="nb" data-view={view}>
      <Tree activeId={note?.id ?? null} view={view} onNew={setNewIn} />
      <div className="nb-main">
        {view !== 'inicio' && (
          <Link href="/caderno" className="nb-back">
            ← Matérias
          </Link>
        )}
        {note && <NoteView key={note.id} note={note} startEditing={params.get('editar') === '1'} />}
        {view === 'mapa' && <GraphView />}
        {(view === 'novo' || view === 'inicio') && <SummarizeForm initialTopic={params.get('tema') ?? ''} />}
      </div>
      {newIn && <NewNoteDialog subjectId={newIn} onClose={() => setNewIn(null)} />}
    </div>
  );
}
