"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-danger">Interrupção</p>
      <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight">A projeção falhou.</h1>
      <p className="mt-4 text-mute">Algo deu errado ao carregar esta página.</p>
      <button onClick={reset} className="mt-8 rounded-full border border-line-strong px-5 py-2.5 text-sm hover:border-gold/50">
        Tentar novamente
      </button>
    </div>
  );
}
