"use client";

import { useState } from "react";
import type { CardData } from "@/lib/card-types";
import { SeriesCard } from "./card/SeriesCard";
import { CardLightbox } from "./CardLightbox";

/** The user's card on a series page: click to open, or render as an "edit" button. */
export function OwnedCard({ card, asEditButton }: { card: CardData; asEditButton?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {asEditButton ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-paper transition-colors hover:border-gold/50"
        >
          Editar nota e reflexão
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="sc-interactive mx-auto block w-full max-w-[380px] text-left" aria-label={`Abrir card de ${card.title}`}>
          <SeriesCard card={card} priority />
        </button>
      )}
      <CardLightbox card={open ? card : null} isOwner initialMode={asEditButton ? "edit" : "view"} onClose={() => setOpen(false)} />
    </>
  );
}
