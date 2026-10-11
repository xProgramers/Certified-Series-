"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardData, SeasonInfo } from "@/lib/card-types";
import { CompleteButton, type WorkForCard } from "./CompleteDialog";
import { SeasonChecklist } from "./SeasonChecklist";

const EMPTY: number[] = [];

/**
 * "Temporadas" on a series page. The card only gains colour once every
 * released season is marked; marking the last one of a series not rated yet
 * opens the rating right away.
 */
export function SeasonsSection({
  work,
  seasons,
  entry,
  owner,
  nextNumber,
  loginHref,
}: {
  work: WorkForCard;
  seasons: SeasonInfo[];
  entry: CardData | null;
  owner: { name: string; username: string } | null;
  nextNumber: number;
  loginHref: string;
}) {
  const [rateOpen, setRateOpen] = useState(false);
  const [saved, setSaved] = useState<CardData | null>(null);
  // Only the latest viewing is tracked here; a rewatch starts with no seasons marked
  const current = saved && (!entry || saved.entryId === entry.entryId) ? saved : entry;
  const released = seasons.filter((s) => s.state === "released").length;
  const waiting = seasons.filter((s) => s.state !== "released");

  return (
    <section aria-labelledby="seasons" className="mt-16 sm:mt-20">
      <header className="binder-head mb-6">
        <h2 id="seasons" className="font-serif text-3xl leading-none tracking-tight sm:text-4xl">
          Temporadas
        </h2>
        <span className="binder-rule" aria-hidden />
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-dim sm:text-[11px]">
          {current && owner
            ? `${current.watchedSeasons?.length ?? 0} de ${released} vistas`
            : `${released} ${released === 1 ? "lançada" : "lançadas"}`}
        </p>
      </header>

      <SeasonChecklist
        contentId={work.contentId}
        entryId={current?.entryId}
        seasons={seasons}
        watched={entry?.watchedSeasons ?? EMPTY}
        editable={!!owner}
        onSaved={(card, allMarked) => {
          setSaved(card);
          if (allMarked && card.rating == null) setRateOpen(true);
        }}
      />

      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-dim">
        {!owner ? (
          <>
            <Link href={loginHref} className="text-mute underline underline-offset-4 hover:text-paper">
              Entre
            </Link>{" "}
            para marcar as temporadas que você terminou.
          </>
        ) : (
          <>
            O card só ganha cor quando todas as temporadas lançadas estiverem marcadas. Quando sai o primeiro episódio de uma temporada nova, ele volta
            ao preto e branco e sobe para o começo da coleção.
            {waiting.length > 0 && " Uma temporada em exibição pode ser marcada quando o último episódio sair."}
          </>
        )}
      </p>

      {owner && (
        <CompleteButton
          hideTrigger
          open={rateOpen}
          onOpenChange={setRateOpen}
          work={work}
          owner={owner}
          entry={current ?? undefined}
          nextNumber={current?.collectionNumber ?? nextNumber}
          viewingNumber={current?.viewingNumber ?? 1}
        />
      )}
    </section>
  );
}
