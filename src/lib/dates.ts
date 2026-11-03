export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISO = (iso: ISODate): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const today = (): ISODate => toISO(new Date());

export const addDays = (iso: ISODate, n: number): ISODate => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const diffDays = (a: ISODate, b: ISODate): number =>
  Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000);

export const startOfWeek = (iso: ISODate): ISODate => {
  const offset = (parseISO(iso).getDay() + 6) % 7;
  return addDays(iso, -offset);
};

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', opts);
const longFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const shortFmt = fmt({ day: '2-digit', month: 'short' });
const dayFmt = fmt({ weekday: 'short' });
const monthFmt = fmt({ month: 'short' });

const clean = (s: string) => s.replace(/\./g, '');

export const formatLong = (iso: ISODate) => {
  const s = longFmt.format(parseISO(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const formatShort = (iso: ISODate) => clean(shortFmt.format(parseISO(iso)));
export const formatWeekday = (iso: ISODate) => clean(dayFmt.format(parseISO(iso))).slice(0, 3);
export const formatMonth = (iso: ISODate) => clean(monthFmt.format(parseISO(iso)));

export const formatMinutes = (minutes: number) => {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h${pad(rest)}` : `${h}h`;
};

export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
