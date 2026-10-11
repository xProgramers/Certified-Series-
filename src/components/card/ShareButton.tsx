"use client";

import { useEffect, useState } from "react";
import { cardHref, formatRating, type CardData } from "@/lib/card-types";
import { shareLink } from "@/lib/native";

type State = "idle" | "copied" | "failed";

/**
 * Shares the card's public page (/card/[id]), whose preview image shows the
 * card in WhatsApp, Discord, X and the like. The Android app and phones get
 * the system share sheet; desktops copy the link.
 */
export function ShareButton({ card, variant = "primary" }: { card: CardData; variant?: "primary" | "outline" }) {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(t);
  }, [state]);

  const share = async () => {
    const url = location.origin + cardHref(card.entryId);
    const title = `${card.title} · Certified Series`;
    // A private card's page shows only the work, so the message keeps the rating out too
    const text =
      card.isPublic && card.status === "completed" && card.rating != null
        ? `${card.title}: ${formatRating(card.rating)}/10 ${card.certification === "certified" ? "✓ Certified" : "✕ Not certified"}`
        : `${card.title} no Certified Series`;
    try {
      if (await shareLink(url, title, text)) return;
      // Phones and tablets: the native sheet. Desktops would open a small OS dialog, so they copy instead
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setState("failed");
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={share}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-all ${
          variant === "primary"
            ? "bg-paper text-ink-0 hover:bg-hi"
            : "border border-line-strong text-paper hover:border-gold/50 hover:bg-paper/[0.03]"
        }`}
      >
        {state === "copied" ? <Check /> : <ShareIcon />}
        {state === "copied" ? "Link copiado" : "Compartilhar"}
      </button>
      <span aria-live="polite" className="text-xs text-danger">
        {state === "failed" && "Não foi possível compartilhar. Tente de novo."}
      </span>
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <path
        d="M8 10V2.5M5 5.2 8 2.2l3 3M4.5 7.5H3.8a.8.8 0 0 0-.8.8v5a.8.8 0 0 0 .8.8h8.4a.8.8 0 0 0 .8-.8v-5a.8.8 0 0 0-.8-.8h-.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
