import { addDays, diffDays, ISODate, startOfWeek } from '../dates';
import { newId } from '../id';
import { Exam, Highlighter, Review, Session, StudySnapshot, Subject, Topic, TopicStatus } from './types';

const CATALOG: { name: string; color: Highlighter; topics: [string, TopicStatus][] }[] = [
  { name: 'Matemática', color: 'amarelo', topics: [['Funções do 2º grau', 'dominado'], ['Logaritmos', 'estudado'], ['Geometria espacial', 'a-estudar'], ['Probabilidade', 'estudado']] },
  { name: 'Biologia', color: 'rosa', topics: [['Citologia', 'dominado'], ['Genética mendeliana', 'estudado'], ['Ecologia', 'a-estudar']] },
  { name: 'História', color: 'laranja', topics: [['Era Vargas', 'estudado'], ['Brasil Colônia', 'dominado'], ['Guerra Fria', 'a-estudar']] },
  { name: 'Física', color: 'turquesa', topics: [['Cinemática', 'dominado'], ['Leis de Newton', 'estudado'], ['Eletrodinâmica', 'a-estudar']] },
  { name: 'Português', color: 'azul', topics: [['Concordância verbal', 'estudado'], ['Interpretação de texto', 'estudado']] },
  { name: 'Redação', color: 'verde', topics: [['Proposta de intervenção', 'estudado'], ['Repertório sociocultural', 'a-estudar']] },
];

const NOTES: Record<string, string> = {
  'Funções do 2º grau': `## Forma geral

Uma função do 2º grau tem a forma ==f(x) = ax² + bx + c==, com a ≠ 0. Seu gráfico é uma parábola.

- **a > 0:** concavidade para cima, o vértice é ponto de mínimo.
- **a < 0:** concavidade para baixo, o vértice é ponto de máximo.

## Raízes e vértice

As raízes vêm de x = (−b ± √Δ) / 2a, com ==Δ = b² − 4ac==.

| Δ | Raízes reais |
|---|---|
| Δ > 0 | duas distintas |
| Δ = 0 | uma (dupla) |
| Δ < 0 | nenhuma |

O vértice fica em x = −b/2a. Movimentos com aceleração constante geram parábolas: veja [[Cinemática]].`,
  Logaritmos: `## Definição

==log_b(a) = x== significa que bˣ = a, com a > 0, b > 0 e b ≠ 1.

## Propriedades

- log(a·c) = log a + log c
- log(a/c) = log a − log c
- log(aⁿ) = n · log a
- ==Mudança de base:== log_b(a) = log_c(a) / log_c(b)

Na prática, o logaritmo é a operação inversa da exponencial. A função logarítmica cresce devagar, ao contrário das [[Funções do 2º grau]], que crescem cada vez mais rápido.`,
  Probabilidade: `## Ideia central

Com casos igualmente prováveis, ==P(A) = casos favoráveis / casos possíveis==. O resultado sempre fica entre 0 e 1.

## Regras

- **Evento complementar:** P(não A) = 1 − P(A)
- **União:** P(A ou B) = P(A) + P(B) − P(A e B)
- **Independentes:** ==P(A e B) = P(A) · P(B)==

A [[Genética mendeliana]] é uma aplicação direta: cruzamentos são calculados com essas regras.`,
  'Genética mendeliana': `## 1ª Lei de Mendel

Cada característica é determinada por um par de alelos que se ==separam na formação dos gametas==.

## Cruzamento Aa × Aa

| | A | a |
|---|---|---|
| **A** | AA | Aa |
| **a** | Aa | aa |

Proporção de genótipos 1:2:1 e de fenótipos 3:1 quando há dominância completa.

## Vocabulário

- **Genótipo:** a composição de alelos.
- **Fenótipo:** a característica observada.

Para calcular as chances, use as regras de [[Probabilidade]]. A divisão celular que separa os alelos está em [[Citologia]].`,
  Citologia: `## Célula

A célula é a unidade básica dos seres vivos.

- **Procariontes:** sem núcleo organizado, como as bactérias.
- **Eucariontes:** com ==núcleo delimitado por membrana==, como animais, plantas e fungos.

## Organelas principais

- **Mitocôndria:** respiração celular e produção de ATP.
- **Ribossomo:** síntese de proteínas.
- **Cloroplasto:** fotossíntese, em células vegetais.

A meiose reduz o número de cromossomos à metade e explica a [[Genética mendeliana]].`,
  Cinemática: `## Movimento uniforme

Velocidade constante: ==s = s₀ + v·t==.

## Movimento uniformemente variado

Aceleração constante:

- v = v₀ + a·t
- ==s = s₀ + v₀·t + a·t²/2==
- v² = v₀² + 2·a·Δs

A posição em função do tempo é uma parábola, como nas [[Funções do 2º grau]]. A causa da aceleração é estudada nas [[Leis de Newton]].`,
  'Leis de Newton': `## As três leis

1. **Inércia:** sem força resultante, o corpo mantém repouso ou movimento retilíneo uniforme.
2. **Princípio fundamental:** ==F = m·a==.
3. **Ação e reação:** forças vêm em pares, iguais e opostos, em corpos diferentes.

## Erro comum

O par ação e reação ==nunca se anula==, porque cada força age em um corpo diferente.

A aceleração encontrada aqui entra nas equações de [[Cinemática]].`,
  'Era Vargas': `## Fases

| Período | Fase |
|---|---|
| 1930–1934 | Governo Provisório |
| 1934–1937 | Governo Constitucional |
| 1937–1945 | ==Estado Novo== |

## Marcas do período

- Centralização do poder e forte propaganda oficial.
- ==Consolidação das Leis do Trabalho (CLT)==, em 1943.
- Criação de estatais como a Companhia Siderúrgica Nacional.

Vargas voltou ao poder pelo voto em 1951, em plena [[Guerra Fria]].`,
};

function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildExample(day: ISODate): StudySnapshot {
  const rand = prng(20261102);
  const now = new Date().toISOString();
  const subjects: Subject[] = [];
  const topics: Topic[] = [];

  for (const entry of CATALOG) {
    const subject: Subject = { id: newId(), name: entry.name, color: entry.color, createdAt: now };
    subjects.push(subject);
    for (const [title, status] of entry.topics) {
      const content = NOTES[title] ?? '';
      topics.push({ id: newId(), subjectId: subject.id, title, status, content, source: content ? 'ia' : 'manual', createdAt: now, updatedAt: now });
    }
  }

  const sessions: Session[] = [];
  const firstDay = addDays(startOfWeek(day), -7 * 19);
  for (let cursor = firstDay; cursor <= day; cursor = addDays(cursor, 1)) {
    const ramp = 0.45 + 0.4 * (1 - diffDays(day, cursor) / 140);
    if (rand() > ramp) continue;
    const blocks = rand() > 0.6 ? 2 : 1;
    for (let b = 0; b < blocks; b += 1) {
      const subject = subjects[Math.floor(rand() * subjects.length)];
      const own = topics.filter((t) => t.subjectId === subject.id);
      const topic = own[Math.floor(rand() * own.length)];
      const questions = rand() > 0.45 ? 10 + Math.floor(rand() * 21) : 0;
      const skill = subject.name === 'Física' ? 0.52 : subject.name === 'Matemática' ? 0.64 : 0.78;
      sessions.push({
        id: newId(),
        subjectId: subject.id,
        topicId: topic.id,
        date: cursor,
        minutes: 25 + Math.floor(rand() * 8) * 10,
        questions,
        correct: Math.round(questions * Math.min(1, skill + rand() * 0.18)),
        note: '',
      });
    }
  }

  const reviewFor = (title: string, offset: number, intervalDays: number, doneAt: ISODate | null = null): Review => {
    const topic = topics.find((t) => t.title === title)!;
    return { id: newId(), subjectId: topic.subjectId, topicId: topic.id, title, dueDate: addDays(day, offset), intervalDays, doneAt };
  };
  const reviews: Review[] = [
    reviewFor('Logaritmos', -3, 7),
    reviewFor('Leis de Newton', -1, 1),
    reviewFor('Genética mendeliana', 0, 7),
    reviewFor('Concordância verbal', 0, 1),
    reviewFor('Era Vargas', 0, 30),
    reviewFor('Probabilidade', 2, 7),
    reviewFor('Proposta de intervenção', 5, 7),
    reviewFor('Interpretação de texto', 21, 30),
    reviewFor('Citologia', -2, 30, addDays(day, -2)),
    reviewFor('Cinemática', -4, 7, addDays(day, -4)),
  ];

  const exams: Exam[] = [
    { id: newId(), name: 'Simulado geral', date: addDays(day, 12) },
    { id: newId(), name: 'Vestibular — 1ª fase', date: addDays(day, 41) },
  ];

  return { subjects, topics, sessions, reviews, exams, profile: { weeklyGoalMinutes: 720 } };
}
