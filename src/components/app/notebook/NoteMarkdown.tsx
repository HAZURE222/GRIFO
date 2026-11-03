'use client';

import { memo, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MARK_HREF, toMarkdown, WIKI_PREFIX } from '@/lib/notes';

type Props = { content: string; onWikiLink?: (title: string) => void; hasNote?: (title: string) => boolean };

export const NoteMarkdown = memo(function NoteMarkdown({ content, onWikiLink, hasNote }: Props) {
  const markdown = useMemo(() => toMarkdown(content), [content]);
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            if (href === MARK_HREF) return <mark>{children}</mark>;
            if (href?.startsWith(WIKI_PREFIX)) {
              const title = decodeURIComponent(href.slice(WIKI_PREFIX.length));
              const exists = hasNote?.(title) ?? true;
              return (
                <button type="button" className={`wiki ${exists ? '' : 'wiki--missing'}`} title={exists ? `Abrir ${title}` : `Criar nota ${title}`} onClick={() => onWikiLink?.(title)}>
                  {children}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="prose-table">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
});
