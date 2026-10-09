import { LEGAL_UPDATED_AT } from "@/lib/site";

/** Plain reading layout for the privacy policy, terms and account pages. */
export function LegalPage({ eyebrow, title, updated = true, children }: {
  eyebrow: string;
  title: string;
  updated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-8 sm:pt-16">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1 className="font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">{title}</h1>
      {updated && <p className="mt-4 text-sm text-dim">Atualizado em {LEGAL_UPDATED_AT}</p>}
      <div className="legal mt-10 space-y-8 text-[15px] leading-relaxed text-mute">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl text-paper">{title}</h2>
      {children}
    </section>
  );
}
