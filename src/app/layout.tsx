import type { Metadata, Viewport } from 'next';
import { Archivo, Atkinson_Hyperlegible_Next, IBM_Plex_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-atkinson', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Grifo', template: '%s · Grifo' },
  description: 'Caderno de estudos com IA: peça um tópico, receba o resumo dentro da matéria e ligue suas notas.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f4ec' },
    { media: '(prefers-color-scheme: dark)', color: '#11130d' },
  ],
};

const bootScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('grifo:theme');d.dataset.theme=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(sessionStorage.getItem('grifo:opened')||matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.pre='off';d.dataset.ready='1'}}catch(e){d.dataset.theme='light';d.dataset.pre='off';d.dataset.ready='1'}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${archivo.variable} ${atkinson.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <noscript>
          <style>{`.pre{display:none}.hero .word>span{transform:none}.hero .mark::before{transform:skewX(-5deg) scaleX(1)}`}</style>
        </noscript>
      </head>
      <body>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <AuthProvider>{children}</AuthProvider>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
