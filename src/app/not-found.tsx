import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="conteudo" style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', gap: 16, padding: 24 }}>
      <h1 className="wordmark" style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', lineHeight: 1 }}>
        Folha arrancada.
      </h1>
      <p>Esta página não existe no caderno.</p>
      <Link href="/caderno" className="btn" style={{ width: 'fit-content' }}>
        Voltar ao caderno
      </Link>
    </main>
  );
}
