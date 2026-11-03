'use client';

import { FormEvent, useState } from 'react';
import { Mark } from '@/components/Mark';
import { Highlighter } from '@/lib/data';
import { useStudy } from './StudyProvider';
import { ColorPicker } from './ui';

export function BlankNotebook({ name }: { name: string }) {
  const { addSubject, nextColor, loadExample } = useStudy();
  const [subject, setSubject] = useState('');
  const [color, setColor] = useState<Highlighter>(nextColor());

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    await addSubject(subject, color);
  };

  return (
    <div className="blank">
      <p className="eyebrow">Caderno em branco</p>
      <h1 className="today-headline">
        {name ? `${name.split(' ')[0]}, qual ` : 'Qual '}é a <Mark delay={300}>primeira matéria</Mark>?
      </h1>
      <form className="blank-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Nome da matéria</span>
          <input className="input input--big" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={60} required autoFocus />
        </label>
        <ColorPicker value={color} onChange={setColor} name="primeira-cor" />
        <button type="submit" className="btn btn--primary">
          Abrir matéria
        </button>
      </form>
      <p className="blank-alt">
        Quer ver o painel cheio antes?{' '}
        <button type="button" className="text-btn" onClick={loadExample}>
          Preencher com dados de exemplo
        </button>
        . Você apaga tudo depois em Ajustes.
      </p>
    </div>
  );
}
