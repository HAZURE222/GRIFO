export type AiMode = 'resumir' | 'encurtar' | 'simplificar' | 'perguntas';
export type AiDepth = 'curto' | 'padrao' | 'detalhado';

export type AiRequest = {
  mode: AiMode;
  subject: string;
  topic: string;
  depth?: AiDepth;
  material?: string;
  note?: string;
  linkTitles?: string[];
};

export type AiEvent =
  | { t: 'text'; v: string }
  | { t: 'done'; truncated: boolean }
  | { t: 'error'; code: AiErrorCode };

export type AiErrorCode = 'no-key' | 'bad-key' | 'rate' | 'overloaded' | 'refused' | 'invalid' | 'network' | 'unknown';

export const AI_LIMITS = { topic: 200, subject: 80, material: 60_000, note: 60_000, links: 200 };

export const AI_ERRORS: Record<AiErrorCode, string> = {
  'no-key': 'A IA ainda não está ligada: falta a chave da NVIDIA NIM neste servidor.',
  'bad-key': 'A chave da NVIDIA NIM foi recusada. Confira se ela está correta.',
  rate: 'Muitos pedidos em pouco tempo. Espere um minuto e tente de novo.',
  overloaded: 'A IA está sobrecarregada agora. Tente de novo em instantes.',
  refused: 'A IA não quis escrever sobre esse tema. Tente reformular o pedido.',
  invalid: 'O pedido não foi aceito. Revise o tema e o material, ou confira o modelo configurado.',
  network: 'A conexão caiu no meio do resumo. Tente de novo.',
  unknown: 'Algo deu errado ao falar com a IA. Tente de novo.',
};
