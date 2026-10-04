import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-gold">N° 0404</p>
      <h1 className="mt-4 font-serif text-6xl leading-none tracking-tight">Fora de cartaz.</h1>
      <p className="mt-4 text-mute">Não encontramos o que você procurava.</p>
      <Link href="/search" className="mt-8 rounded-full border border-line-strong px-5 py-2.5 text-sm hover:border-gold/50">
        Buscar uma série
      </Link>
    </div>
  );
}
