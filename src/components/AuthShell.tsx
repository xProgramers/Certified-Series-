import { ContentCard } from "@/components/card/ContentCard";
import { sampleCards } from "@/lib/sample-cards";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const card = sampleCards()[2];
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1200px] items-center gap-16 px-4 py-12 sm:px-8 lg:grid-cols-2">
      <div className="relative hidden lg:block" aria-hidden>
        <div className="absolute inset-0 m-auto h-3/4 w-3/4 rounded-full bg-gold/[0.06] blur-[90px]" />
        <div className="relative mx-auto w-[360px] -rotate-3 sc-reveal">
          <ContentCard card={card} priority />
        </div>
      </div>
      <div className="mx-auto w-full max-w-md rise">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">{title}</h1>
        <p className="mb-10 mt-4 text-mute">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
