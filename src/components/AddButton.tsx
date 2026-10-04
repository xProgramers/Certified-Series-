"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCollection } from "@/app/actions/collection";
import type { ContentType, EntryStatus } from "@/lib/card-types";

export type Owned = { status: EntryStatus; n: number } | undefined;

/**
 * "Adicionar à coleção" in one tap. The work joins the collection immediately,
 * in progress; the button then reflects what the user has of it.
 */
export function AddButton({
  type,
  id,
  owned,
  signedIn,
  variant = "compact",
  onAdded,
}: {
  type: ContentType;
  id: number;
  owned: Owned;
  signedIn: boolean;
  variant?: "compact" | "primary";
  onAdded?: (owned: NonNullable<Owned>) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<Owned>(owned);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Server data changed (router.refresh) → adopt it
  const [prev, setPrev] = useState(owned);
  if (owned !== prev) {
    setPrev(owned);
    setState(owned);
  }

  const primary = variant === "primary";
  const base = primary
    ? "inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-colors"
    : "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors";

  if (!signedIn) {
    return (
      <Link href={`/login?next=/search`} className={`${base} ${primary ? "bg-paper text-ink-0 hover:bg-hi" : "text-mute hover:text-paper"}`}>
        <Plus /> Adicionar
      </Link>
    );
  }

  if (state) {
    const label = state.status === "in_progress" ? "Em andamento" : "Na coleção";
    return (
      <span className={`${base} ${primary ? "border border-line-strong text-mute" : "text-dim"}`}>
        {state.status === "in_progress" ? <Ring /> : <Check />} {label}
      </span>
    );
  }

  const add = () =>
    start(async () => {
      setError(null);
      const res = await addToCollection({ contentType: type, contentId: id });
      if (!res.ok) return setError(res.error);
      const next = { status: res.data.status, n: res.data.collectionNumber };
      setState(next);
      onAdded?.(next);
      router.refresh();
    });

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={add}
        disabled={pending}
        className={`${base} ${
          primary ? "bg-paper text-ink-0 hover:bg-hi" : "bg-paper/[0.06] text-paper hover:bg-paper/[0.12]"
        } disabled:opacity-60`}
      >
        <Plus /> {pending ? "Adicionando…" : primary ? "Adicionar à coleção" : "Adicionar"}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}

function Plus() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 text-gold" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Ring() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
      <path d="M8 3 A5 5 0 1 1 3 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
