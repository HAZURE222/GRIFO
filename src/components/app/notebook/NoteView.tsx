'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise, BookOpen, Check, PencilSimple, Repeat, Sparkle, Stop, Timer, Trash } from '@phosphor-icons/react';
import { AI_LIMITS, AiMode } from '@/lib/ai/types';
import { useAiStream } from '@/lib/ai/useAiStream';
import { Topic, TopicStatus } from '@/lib/data';
import { backlinks, extractLinks, findByTitle } from '@/lib/notes';
import { useStudy } from '../StudyProvider';
import { useTimer } from '../TimerProvider';
import { Swatch, useUI } from '../ui';
import { NoteMarkdown } from './NoteMarkdown';

const STATUS: { value: TopicStatus; label: string }[] = [
  { value: 'a-estudar', label: 'A estudar' },
  { value: 'estudado', label: 'Estudado' },
  { value: 'dominado', label: 'Dominado' },
];

const AI_ACTIONS: { mode: AiMode; label: string }[] = [
  { mode: 'encurtar', label: 'Encurtar' },
  { mode: 'simplificar', label: 'Simplificar' },
  { mode: 'perguntas', label: 'Gerar perguntas' },
];

function useOpenByTitle(subjectId: string) {
  const router = useRouter();
  const { topics, createNote } = useStudy();
  return useCallback(
    async (title: string) => {
      const found = findByTitle(topics, title);
      const id = found?.id ?? (await createNote({ subjectId, title, content: '', source: 'manual' }));
      router.push(`/caderno?nota=${id}`);
    },
    [topics, createNote, subjectId, router],
  );
}

function Editor({ value, onChange, titles }: { value: string; onChange: (v: string) => void; titles: string[] }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const pendingCaret = useRef<number | null>(null);

  const suggestions = query === null ? [] : titles.filter((t) => t.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))).slice(0, 6);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
    if (pendingCaret.current !== null) {
      el.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [value]);

  const detect = (text: string, caret: number) => {
    const match = /\[\[([^\]\n]*)$/.exec(text.slice(0, caret));
    setQuery(match ? match[1] : null);
    setActive(0);
  };

  const accept = (title: string) => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const start = value.slice(0, caret).lastIndexOf('[[');
    const closing = value.slice(caret).startsWith(']]') ? 2 : 0;
    const next = `${value.slice(0, start)}[[${title}]]${value.slice(caret + closing)}`;
    pendingCaret.current = start + title.length + 4;
    onChange(next);
    setQuery(null);
    el.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((active + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((active - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      accept(suggestions[active]);
    } else if (e.key === 'Escape') {
      setQuery(null);
    }
  };

  return (
    <div className="editor">
      <label className="sr-only" htmlFor="nota-texto">
        Texto da nota em Markdown
      </label>
      <textarea
        id="nota-texto"
        ref={ref}
        className="editor-area"
        value={value}
        spellCheck
        placeholder="Escreva aqui. ## cria um título, ==texto== grifa e [[ liga a outra nota."
        onChange={(e) => {
          onChange(e.target.value);
          detect(e.target.value, e.target.selectionStart);
        }}
        onKeyUp={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') detect(e.currentTarget.value, e.currentTarget.selectionStart);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        role={suggestions.length ? 'combobox' : undefined}
        aria-expanded={suggestions.length ? true : undefined}
        aria-controls={suggestions.length ? 'sugestoes-link' : undefined}
      />
      {suggestions.length > 0 && (
        <ul
          id="sugestoes-link"
          className="editor-suggest"
          role="listbox"
          aria-label="Ligar a outra nota"
          style={{ top: `${(value.slice(0, ref.current?.selectionStart ?? value.length).split('\n').length) * 25.5 + 6}px` }}
        >
          {suggestions.map((title, i) => (
            <li key={title} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? 'is-on' : ''}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  accept(title);
                }}
              >
                {title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Connections({ note, onOpen }: { note: Topic; onOpen: (title: string) => void }) {
  const { topics } = useStudy();
  const incoming = backlinks(note, topics);
  const outgoing = extractLinks(note.content);
  return (
    <aside className="links" aria-label="Conexões da nota">
      <section>
        <h2>Citada em</h2>
        {incoming.length ? (
          <ul>
            {incoming.map((t) => (
              <li key={t.id}>
                <Link href={`/caderno?nota=${t.id}`}>{t.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma nota cita esta ainda.</p>
        )}
      </section>
      <section>
        <h2>Cita</h2>
        {outgoing.length ? (
          <ul>
            {outgoing.map((title) => {
              const exists = Boolean(findByTitle(topics, title));
              return (
                <li key={title}>
                  <button type="button" className={`links-out ${exists ? '' : 'wiki--missing'}`} onClick={() => onOpen(title)}>
                    {title}
                    {!exists && <small> criar</small>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>
            Escreva <code>[[</code> no texto para ligar a outra nota.
          </p>
        )}
      </section>
    </aside>
  );
}

export function NoteView({ note, startEditing }: { note: Topic; startEditing: boolean }) {
  const router = useRouter();
  const study = useStudy();
  const { subjects, topics, reviews, saveNote, setTopicStatus, removeTopic, scheduleReviews } = study;
  const timer = useTimer();
  const { confirm, toast } = useUI();
  const ai = useAiStream();
  const subject = subjects.find((s) => s.id === note.subjectId);

  const [editing, setEditing] = useState(startEditing || !note.content);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saved, setSaved] = useState(true);
  const [aiMode, setAiMode] = useState<AiMode | null>(null);
  const [undo, setUndo] = useState<string | null>(null);

  const latest = useRef({ note, title, content });
  latest.current = { note, title, content };

  const flush = useCallback(() => {
    const { note: current, title: t, content: c } = latest.current;
    const cleanTitle = t.trim() || current.title;
    if (cleanTitle !== current.title || c !== current.content) return saveNote(current, { title: cleanTitle, content: c });
    return Promise.resolve();
  }, [saveNote]);

  useEffect(() => {
    if (saved) return;
    const id = window.setTimeout(() => {
      flush().then(() => setSaved(true));
    }, 700);
    return () => window.clearTimeout(id);
  }, [title, content, saved, flush]);

  useEffect(
    () => () => {
      const { note: current, title: t, content: c } = latest.current;
      const cleanTitle = t.trim() || current.title;
      if (cleanTitle !== current.title || c !== current.content) saveNote(current, { title: cleanTitle, content: c });
    },
    [saveNote],
  );

  const change = (next: string) => {
    setContent(next);
    setSaved(false);
  };

  const openByTitle = useOpenByTitle(note.subjectId);
  const hasNote = useCallback((t: string) => Boolean(findByTitle(topics, t)), [topics]);
  const otherTitles = topics.filter((t) => t.id !== note.id).map((t) => t.title);
  const pending = reviews.filter((r) => r.topicId === note.id && !r.doneAt).length;

  const askAi = (mode: AiMode) => {
    setAiMode(mode);
    setUndo(null);
    ai.run({
      mode,
      subject: subject?.name ?? '',
      topic: title,
      note: content,
      linkTitles: otherTitles.slice(0, AI_LIMITS.links),
    });
  };

  const applyAi = (how: 'replace' | 'append') => {
    setUndo(content);
    const heading = aiMode === 'perguntas' ? '## Perguntas de revisão\n\n' : '';
    change(how === 'replace' ? ai.text : `${content.trimEnd()}\n\n${heading}${ai.text}`);
    setAiMode(null);
    ai.reset();
  };

  const discardAi = () => {
    setAiMode(null);
    ai.reset();
  };

  const aiBusy = ai.status === 'streaming';
  const aiReady = ai.status === 'done' || (ai.status === 'stopped' && ai.text.trim());

  return (
    <div className="note-layout">
      <article className="note">
        <header className="note-head">
          <p className="note-crumb">
            {subject && <Swatch color={subject.color} />}
            {subject?.name}
            <span className="note-save" role="status">
              {saved ? 'Salvo' : 'Salvando…'}
            </span>
          </p>
          <label className="sr-only" htmlFor="nota-titulo">
            Título da nota
          </label>
          <input
            id="nota-titulo"
            className="note-title"
            value={title}
            maxLength={120}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
          />
          {note.source === 'ia' && <p className="note-ai-flag">Escrita com IA. Confira com o seu material.</p>}

          <div className="note-bar">
            <div className="seg" role="group" aria-label="Modo da nota">
              <button type="button" aria-pressed={!editing} className={!editing ? 'is-on' : ''} onClick={() => setEditing(false)}>
                <BookOpen aria-hidden="true" /> Ler
              </button>
              <button type="button" aria-pressed={editing} className={editing ? 'is-on' : ''} onClick={() => setEditing(true)}>
                <PencilSimple aria-hidden="true" /> Editar
              </button>
            </div>
            <div className="seg" role="group" aria-label="Situação do estudo">
              {STATUS.map((s) => (
                <button key={s.value} type="button" aria-pressed={note.status === s.value} className={note.status === s.value ? 'is-on' : ''} onClick={() => setTopicStatus({ ...note, title: latest.current.title, content: latest.current.content }, s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="note-tools">
              <button
                type="button"
                className="btn btn--quiet note-tool"
                onClick={() => {
                  timer.configure({ subjectId: note.subjectId, topicId: note.id });
                  router.push('/hoje');
                }}
              >
                <Timer aria-hidden="true" /> Estudar
              </button>
              <button
                type="button"
                className="btn btn--quiet note-tool"
                disabled={pending > 0}
                onClick={async () => {
                  await scheduleReviews(note.subjectId, note.id, title);
                  toast('Revisões agendadas para 1, 7 e 30 dias.');
                }}
              >
                <Repeat aria-hidden="true" /> {pending ? `${pending} na fila` : 'Agendar revisões'}
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Excluir nota"
                title="Excluir nota"
                onClick={async () => {
                  const ok = await confirm({ title: 'Excluir nota?', body: `${title} e suas revisões saem do caderno. As sessões continuam no histórico.`, action: 'Excluir' });
                  if (ok) {
                    setSaved(true);
                    latest.current = { note, title: note.title, content: note.content };
                    await removeTopic(note.id);
                    router.replace('/caderno');
                  }
                }}
              >
                <Trash aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div className="note-ai" role="group" aria-label="Pedir à IA">
          <Sparkle weight="fill" aria-hidden="true" />
          {!content.trim() ? (
            <button type="button" className="note-ai-btn" onClick={() => router.push(`/caderno?novo=1&tema=${encodeURIComponent(title)}`)}>
              Pedir um resumo deste tópico
            </button>
          ) : (
            AI_ACTIONS.map((a) => (
              <button key={a.mode} type="button" className="note-ai-btn" disabled={aiBusy} onClick={() => askAi(a.mode)}>
                {a.label}
              </button>
            ))
          )}
          {undo !== null && (
            <button
              type="button"
              className="note-ai-btn note-ai-undo"
              onClick={() => {
                change(undo);
                setUndo(null);
              }}
            >
              <ArrowCounterClockwise aria-hidden="true" /> Desfazer
            </button>
          )}
        </div>

        {ai.error && (
          <p className="field-error note-ai-error" role="alert">
            {ai.error}
          </p>
        )}

        {aiMode && ai.status !== 'error' && (
          <section className="ai-draft" aria-busy={aiBusy} aria-label="Rascunho da IA">
            <p className="eyebrow">{aiBusy ? 'A IA está escrevendo' : 'Rascunho da IA'}</p>
            {ai.text ? <NoteMarkdown content={ai.text} hasNote={hasNote} /> : <p className="quiet-note">Lendo a nota…</p>}
            {aiBusy && <span className="stream-caret" aria-hidden="true" />}
            {ai.truncated && <p className="field-error">O texto ficou incompleto por ser longo demais.</p>}
            <div className="ai-draft-actions">
              {aiBusy && (
                <button type="button" className="btn" onClick={ai.stop}>
                  <Stop weight="fill" aria-hidden="true" /> Parar
                </button>
              )}
              {aiReady && (
                <>
                  {aiMode === 'perguntas' ? (
                    <button type="button" className="btn btn--primary" onClick={() => applyAi('append')}>
                      <Check weight="bold" aria-hidden="true" /> Adicionar à nota
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn btn--primary" onClick={() => applyAi('replace')}>
                        <Check weight="bold" aria-hidden="true" /> Substituir a nota
                      </button>
                      <button type="button" className="btn" onClick={() => applyAi('append')}>
                        Adicionar ao fim
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn--quiet" onClick={discardAi}>
                    Descartar
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        <div className="note-page">
          {editing ? (
            <Editor value={content} onChange={change} titles={otherTitles} />
          ) : content.trim() ? (
            <NoteMarkdown content={content} onWikiLink={openByTitle} hasNote={hasNote} />
          ) : (
            <p className="quiet-note">Nota vazia.</p>
          )}
        </div>
      </article>
      <Connections note={{ ...note, content }} onOpen={openByTitle} />
    </div>
  );
}
