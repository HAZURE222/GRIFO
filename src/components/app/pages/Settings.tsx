'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useStudy } from '../StudyProvider';
import { PageHead, useUI } from '../ui';

type ThemeChoice = 'system' | 'light' | 'dark';
const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Papel' },
  { value: 'dark', label: 'Madrugada' },
];

function applyTheme(choice: ThemeChoice) {
  try {
    if (choice === 'system') localStorage.removeItem('grifo:theme');
    else localStorage.setItem('grifo:theme', choice);
  } catch {
    /* sem armazenamento, o tema vale só até recarregar */
  }
  document.documentElement.dataset.theme = choice === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : choice;
}

export function SettingsPage() {
  const { account, signOut } = useAuth();
  const { profile, setWeeklyGoal, loadExample, eraseAll, subjects } = useStudy();
  const { confirm, toast } = useUI();
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [hours, setHours] = useState(String(profile.weeklyGoalMinutes / 60));

  useEffect(() => {
    try {
      const saved = localStorage.getItem('grifo:theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {
      /* mantém o tema do sistema */
    }
  }, []);

  return (
    <>
      <PageHead title="Ajustes" />
      <div className="settings">
        <section>
          <h2>Conta</h2>
          <div>
            <p className="settings-name">{account?.name}</p>
            <p className="mono">{account?.email}</p>
            <button
              type="button"
              className="btn"
              onClick={signOut}
            >
              Sair
            </button>
          </div>
        </section>
        <section>
          <h2>Meta semanal</h2>
          <form
            className="settings-goal"
            onSubmit={async (e) => {
              e.preventDefault();
              const value = Number(hours);
              if (!Number.isFinite(value) || value <= 0) return toast('Informe uma meta maior que zero.', 'error');
              await setWeeklyGoal(Math.round(value * 60));
              toast('Meta atualizada.');
            }}
          >
            <label className="field">
              <span>Horas por semana</span>
              <input type="number" min={0.5} max={120} step={0.5} inputMode="decimal" className="input" value={hours} onChange={(e) => setHours(e.target.value)} />
            </label>
            <button type="submit" className="btn">
              Salvar
            </button>
          </form>
        </section>
        <section>
          <h2>Aparência</h2>
          <div className="seg seg--wide" role="group" aria-label="Tema">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={theme === t.value}
                className={theme === t.value ? 'is-on' : ''}
                onClick={() => {
                  setTheme(t.value);
                  applyTheme(t.value);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2>Dados</h2>
          <div className="settings-data">
            <p>Tudo fica neste navegador. Limpar os dados do site apaga o caderno.</p>
            <div>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  if (subjects.length) {
                    const ok = await confirm({ title: 'Substituir pelo exemplo?', body: 'Seus dados atuais serão trocados pelos dados de exemplo.', action: 'Substituir' });
                    if (!ok) return;
                  }
                  await loadExample();
                  toast('Exemplo carregado.');
                }}
              >
                Carregar exemplo
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={async () => {
                  const ok = await confirm({ title: 'Apagar todo o caderno?', body: 'Matérias, sessões, revisões e provas serão apagadas. Não dá para desfazer.', action: 'Apagar tudo' });
                  if (ok) {
                    await eraseAll();
                    toast('Caderno apagado.');
                  }
                }}
              >
                Apagar tudo
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
