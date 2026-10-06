"use client";

import type { CardData } from "@/lib/card-types";
import { ArenaCardBack } from "./ArenaCardBack";
import { ContentCard } from "./ContentCard";

/** A card that turns over to show its Arena stats. */
export function ArenaCard({ card, flipped, onFlip }: { card: CardData; flipped: boolean; onFlip: () => void }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-pressed={flipped}
      aria-label={`${flipped ? "Mostrar frente" : "Mostrar atributos"} de ${card.title}`}
      className={`ac sc-interactive block w-full text-left ${flipped ? "is-flipped" : ""}`}
    >
      <div className="ac-inner">
        <div className="ac-face" aria-hidden={flipped}>
          <ContentCard card={card} posterSize="w342" />
        </div>
        <div className="ac-face ac-back" aria-hidden={!flipped}>
          <ArenaCardBack card={card} />
        </div>
      </div>
    </button>
  );
}
