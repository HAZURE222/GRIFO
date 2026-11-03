'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Sparkle, Stop } from '@phosphor-icons/react';
import { Mark } from '@/components/Mark';
import { AI_LIMITS, AiDepth } from '@/lib/ai/types';
import { useAiStream } from '@/lib/ai/useAiStream';
import { Highlighter } from '@/lib/data';
import { useStudy } from '../StudyProvider';
import { ColorPicker, useUI } from '../ui';
import { NoteMarkdown } from './NoteMarkdown';

const NEW_SUBJECT = '__nova__';
const DEPTHS: { value: AiDepth; label: string }[] = [
  { value: 'curto', label: 'Curto' },
  { value: 'padrao', label: 'Padrão' },
  { value: 'detalhado', label: 'Detalhado' },
];

export function SummarizeForm({ initialTopic }: { initialTopic: string }) {
  const router = useRouter();
  const { subjects, topics, addSubject, createNote, nextColor, loadExample } = useStudy();
  const { toast } = useUI();
  const ai = useAiStream();

  const [topic, setTopic] = useState(initialTopic);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? NEW_SUBJECT);
  const [newName, setNewName] = useState('');
  const [color, setColor] = useState<Highlighter>(nextColor());
  const [depth, setDepth] = useState<AiDepth>('padrao');
  const [material, setMaterial] = useState('');
  const [showMaterial, setShowMaterial] = useState(false);

  const creatingSubject = subjectId === NEW_SUBJECT || !subjects.length;
  const subjectName = creatingSubject ? newName.trim() : subjects.find((s) => s.id === subjectId)?.name ?? '';

  const save = async (content: string) => {
    const owner = creatingSubject ? await addSubject(newName, color) : subjectId;
    const id = await createNote({ subjectId: owner, title: topic, content, source: 'ia' });
    toast(`Resumo salvo em ${subjectName}.`);
    router.push(`/caderno?nota=${id}`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !subjectName) return;
    const content = await ai.run({
      mode: 'resumir',
      subject: subjectName,
      topic: topic.trim(),
      depth,
      material: material.trim() || undefined,
      linkTitles: topics.map((t) => t.title).slice(0, AI_LIMITS.links),
    });
    if (content?.trim()) await save(content);
  };

  const busy = ai.status === 'streaming';
  const showStream = busy || ai.status === 'stopped' || (ai.status === 'done' && ai.text);

  if (showStream) {
    return (
      <section className="stream" aria-live="off" aria-busy={busy}>
        <p className="eyebrow">{busy ? `Escrevendo em ${subjectName}` : ai.status === 'stopped' ? 'Interrompido' : `Salvando em ${subjectName}`}</p>
        <h1 className="note-title-static">{topic}</h1>
        <div className="note-page">
          {ai.text ? <NoteMarkdown content={ai.text} /> : <p className="quiet-note">Lendo o pedido…</p>}
          {busy && <span className="stream-caret" aria-hidden="true" />}
        </div>
        <div className="stream-actions">
          {busy && (
            <button type="button" className="btn" onClick={ai.stop}>
              <Stop weight="fill" aria-hidden="true" /> Parar
            </button>
          )}
          {ai.status === 'stopped' && (
            <>
              {ai.text.trim() && (
                <button type="button" className="btn btn--primary" onClick={() => save(ai.text)}>
                  Guardar o que foi escrito
                </button>
              )}
              <button type="button" className="btn btn--quiet" onClick={ai.reset}>
                Voltar ao pedido
              </button>
            </>
          )}
        </div>
        <span className="sr-only" role="status">
          {busy ? 'A IA está escrevendo o resumo.' : ''}
        </span>
      </section>
    );
  }

  return (
    <section className="ask">
      <h1 className="today-headline ask-title">
        O que você quer <Mark delay={250}>entender</Mark> hoje?
      </h1>
      <form className="ask-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Tópico</span>
          <input
            className="input input--big"
            value={topic}
            maxLength={AI_LIMITS.topic}
            placeholder="Ex.: Ciclo de Krebs"
            required
            autoFocus
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>

        <div className="ask-row">
          {subjects.length > 0 && (
            <label className="field">
              <span>Guardar em</span>
              <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value={NEW_SUBJECT}>Nova matéria…</option>
              </select>
            </label>
          )}
          {creatingSubject && (
            <label className="field">
              <span>Nome da nova matéria</span>
              <input className="input" value={newName} maxLength={60} required onChange={(e) => setNewName(e.target.value)} />
            </label>
          )}
          <div className="field">
            <span id="tamanho">Tamanho</span>
            <div className="seg seg--wide" role="group" aria-labelledby="tamanho">
              {DEPTHS.map((d) => (
                <button key={d.value} type="button" aria-pressed={depth === d.value} className={depth === d.value ? 'is-on' : ''} onClick={() => setDepth(d.value)}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {creatingSubject && <ColorPicker value={color} onChange={setColor} name="cor-nova-materia" />}

        {showMaterial ? (
          <label className="field">
            <span>Seu material (a IA resume só o que estiver aqui)</span>
            <textarea className="ask-material" rows={8} value={material} maxLength={AI_LIMITS.material} onChange={(e) => setMaterial(e.target.value)} placeholder="Cole aqui um trecho do livro, da apostila ou da sua anotação de aula." />
          </label>
        ) : (
          <button type="button" className="text-btn ask-add" onClick={() => setShowMaterial(true)}>
            Colar meu próprio material
          </button>
        )}

        {ai.error && (
          <p className="field-error" role="alert">
            {ai.error}
          </p>
        )}

        <div>
          <button type="submit" className="btn btn--primary ask-submit">
            <Sparkle weight="fill" aria-hidden="true" /> Resumir
          </button>
        </div>
      </form>

      {!topics.length && (
        <p className="blank-alt ask-example">
          Quer ver o caderno cheio antes?{' '}
          <button type="button" className="text-btn" onClick={loadExample}>
            Preencher com dados de exemplo
          </button>
          .
        </p>
      )}
      <p className="ask-note">Resumos de IA podem conter erros. Confira com o seu material antes da prova.</p>
    </section>
  );
}
