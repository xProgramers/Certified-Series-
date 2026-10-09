"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ACHIEVEMENT_BY_KEY, byPrestige, type Earned } from "@/lib/achievements";
import { formatCollectionNumber, type CardData } from "@/lib/card-types";
import { MedalStage } from "./achievements/MedalStage";
import { ContentCard } from "./card/ContentCard";
import { useCardExport } from "./card/CardExport";
import { ActionButton } from "./CardLightbox";
import { CloseButton, Modal } from "./Modal";

type Reveal = { card: CardData; unlocked: Earned[]; username: string };

/*
 * The moment a card is certified. It is mounted once in the layout, outside
 * the page, because saving refreshes the page behind it: the button that
 * opened the completion dialog is often gone by the time the card is sealed.
 */
let current: Reveal | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showReveal(r: Reveal) {
  current = r;
  emit();
}

function closeReveal() {
  current = null;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function CompletionRevealHost() {
  const reveal = useSyncExternalStore(subscribe, () => current, () => null);
  const router = useRouter();
  const close = () => {
    closeReveal();
    router.refresh();
  };
  return (
    <Modal open={!!reveal} onClose={close} label="Card concluído">
      {reveal && <RevealBody key={reveal.card.entryId} {...reveal} onClose={close} />}
    </Modal>
  );
}

function RevealBody({ card, unlocked, username, onClose }: Reveal & { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { exportCard, busy, stage } = useCardExport();
  const certified = card.certification === "certified";
  return (
    <div data-backdrop className="flex min-h-dvh flex-col items-center justify-center gap-10 overflow-y-auto px-4 py-16">
      <CloseButton onClick={onClose} className="fixed right-4 top-4 sm:right-6 sm:top-6" />
      <div className="sc-reveal relative w-full max-w-[min(400px,72vw)]">
        <ContentCard card={card} posterSize="w780" priority />
      </div>
      <div className="relative text-center rise" style={{ animationDelay: "1.2s" }}>
        <p className="font-mono text-xs tracking-[0.3em] text-gold">
          N° {formatCollectionNumber(card.collectionNumber)} · {certified ? "Certified" : "Not certified"}
        </p>
        <p className="mx-auto mt-3 max-w-md font-serif text-3xl italic sm:text-4xl">
          {certified ? "Concluído e certificado." : "Concluído. Esta obra não recebeu sua certificação."}
        </p>
        {unlocked.length > 0 && <Unlocked earned={unlocked} username={username} onNavigate={closeReveal} />}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            href={`/u/${username}?new=${card.entryId}`}
            onClick={closeReveal}
            className="rounded-full bg-paper px-5 py-2.5 text-sm text-ink-0 transition-colors hover:bg-hi"
          >
            Ver na coleção
          </Link>
          <ActionButton onClick={() => exportCard(card, "card").catch(() => setError("Não foi possível gerar a imagem."))} disabled={!!busy}>
            {busy === "card" ? "Gerando…" : "Salvar PNG"}
          </ActionButton>
          <ActionButton onClick={() => exportCard(card, "story").catch(() => setError("Não foi possível gerar a imagem."))} disabled={!!busy}>
            {busy === "story" ? "Gerando…" : "Stories"}
          </ActionButton>
        </div>
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>
      {stage}
    </div>
  );
}

/** The unlock moment: the seals this card just earned spin in under it. */
function Unlocked({ earned, username, onNavigate }: { earned: Earned[]; username: string; onNavigate: () => void }) {
  const list = [...earned].sort(byPrestige).slice(0, 4);
  return (
    <div className="mt-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">
        {list.length > 1 ? "Novas conquistas" : "Nova conquista"}
      </p>
      <ul className="mt-5 flex flex-wrap justify-center gap-8">
        {list.map((e, i) => {
          const def = ACHIEVEMENT_BY_KEY[e.key];
          return (
            <li key={`${e.key}${e.scope}`} className="flex w-44 flex-col items-center">
              <MedalStage achievement={e.key} className="w-28" delay={1600 + i * 350} />
              <span className="mt-3 font-serif text-xl leading-none">{def.name}</span>
              {e.label && <span className="mt-1 text-xs text-mute">{e.label}</span>}
              <span className="mt-2 text-xs leading-snug text-dim">{def.rule}</span>
            </li>
          );
        })}
      </ul>
      <Link
        href={`/u/${username}/conquistas`}
        onClick={onNavigate}
        className="mt-5 inline-block text-sm text-mute underline-offset-4 transition-colors hover:text-paper hover:underline"
      >
        Ver todas as conquistas
      </Link>
    </div>
  );
}
