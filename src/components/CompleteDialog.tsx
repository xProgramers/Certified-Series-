"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { completeSeries } from "@/app/actions/collection";
import type { CardPalette } from "@/db/schema";
import { formatCollectionNumber, type CardData } from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import { extractPalette } from "@/lib/palette";
import { SeriesCard } from "./card/SeriesCard";
import { useCardExport } from "./card/CardExport";
import { ActionButton } from "./CardLightbox";
import { EntryFields, todayISO, type EntryValues } from "./EntryForm";
import { CloseButton, Modal } from "./Modal";

export type SeriesForCard = Pick<
  CardData,
  "seriesId" | "title" | "firstAirYear" | "lastAirYear" | "seasons" | "genres" | "posterPath" | "backdropPath"
>;

export function CompleteButton({
  series,
  owner,
  nextNumber,
  viewingNumber,
  label = "Marcar como concluída",
  variant = "primary",
  hideTrigger,
}: {
  series: SeriesForCard;
  owner: { name: string; username: string };
  nextNumber: number;
  viewingNumber: number;
  label?: string;
  variant?: "primary" | "text";
  hideTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {hideTrigger ? null : variant === "primary" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group inline-flex items-center gap-3 rounded-full bg-paper py-3.5 pl-6 pr-5 text-sm font-medium text-ink-0 transition-colors hover:bg-white"
        >
          {label}
          <span className="grid h-6 w-6 place-items-center rounded-full border border-ink-0/20 transition-transform duration-500 group-hover:rotate-[360deg]">
            <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="text-sm text-mute underline-offset-4 hover:text-paper hover:underline">
          {label}
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} label={`Concluir ${series.title}`}>
        <CompleteFlow
          series={series}
          owner={owner}
          nextNumber={nextNumber}
          viewingNumber={viewingNumber}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function CompleteFlow({
  series,
  owner,
  nextNumber,
  viewingNumber,
  onClose,
}: {
  series: SeriesForCard;
  owner: { name: string; username: string };
  nextNumber: number;
  viewingNumber: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<EntryValues>({ rating: 8, reflection: "", watchedAt: todayISO(), isPublic: true });
  const [palette, setPalette] = useState<CardPalette | null>(null);
  const [created, setCreated] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { exportCard, busy, stage } = useCardExport();

  useEffect(() => {
    const src = posterUrl(series.posterPath, "w185");
    if (src) extractPalette(src).then(setPalette).catch(() => setPalette(null));
  }, [series.posterPath]);

  const preview: CardData = {
    ...series,
    entryId: "preview",
    rating: values.rating,
    reflection: values.reflection,
    watchedAt: values.watchedAt + "T12:00:00.000Z",
    collectionNumber: nextNumber,
    viewingNumber,
    ownerName: owner.name,
    ownerUsername: owner.username,
    isFavorite: false,
    isPublic: values.isPublic,
    palette,
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await completeSeries({ seriesId: series.seriesId, palette, ...values });
      if (!res.ok) return setError(res.error);
      setCreated(res.data);
    });

  const close = () => {
    if (created) router.refresh();
    onClose();
  };

  if (created) {
    return (
      <div data-backdrop className="flex min-h-dvh flex-col items-center justify-center gap-10 overflow-y-auto px-4 py-16">
        <CloseButton onClick={close} className="fixed right-4 top-4 sm:right-6 sm:top-6" />
        <div className="pointer-events-none fixed left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px]" style={{ background: created.palette?.glow ?? "#4a3f2c" }} />
        <div className="sc-reveal relative w-full max-w-[400px]">
          <SeriesCard card={created} posterSize="w780" priority />
        </div>
        <div className="relative text-center rise" style={{ animationDelay: "1.2s" }}>
          <p className="font-mono text-xs tracking-[0.3em] text-gold">N° {formatCollectionNumber(created.collectionNumber)}</p>
          <p className="mt-3 font-serif text-3xl italic sm:text-4xl">Mais uma obra entrou para a sua coleção.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link
              href={`/u/${owner.username}?new=${created.entryId}`}
              onClick={onClose}
              className="rounded-full bg-paper px-5 py-2.5 text-sm text-ink-0 transition-colors hover:bg-white"
            >
              Ver na coleção
            </Link>
            <ActionButton onClick={() => exportCard(created, "card").catch(() => setError("Não foi possível gerar a imagem."))} disabled={!!busy}>
              {busy === "card" ? "Gerando…" : "Salvar PNG"}
            </ActionButton>
            <ActionButton onClick={() => exportCard(created, "story").catch(() => setError("Não foi possível gerar a imagem."))} disabled={!!busy}>
              {busy === "story" ? "Gerando…" : "Stories"}
            </ActionButton>
          </div>
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        </div>
        {stage}
      </div>
    );
  }

  return (
    <div data-backdrop className="flex min-h-dvh items-start justify-center overflow-y-auto px-4 py-16 sm:items-center sm:px-8">
      <CloseButton onClick={close} className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6" />
      <div className="grid w-full max-w-5xl gap-12 md:grid-cols-[minmax(0,380px)_1fr] md:gap-16">
        <div className="order-2 md:order-1">
          <p className="eyebrow mb-4 text-center md:text-left">Prévia do seu card</p>
          <div className="mx-auto w-full max-w-[380px]">
            <SeriesCard card={preview} priority />
          </div>
        </div>
        <form
          className="order-1 md:order-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="eyebrow">{viewingNumber > 1 ? `Rewatch · ${viewingNumber}ª vez` : "Concluir série"}</p>
          <h2 className="mb-10 mt-3 font-serif text-5xl leading-[0.95] tracking-tight">{series.title}</h2>
          <EntryFields values={values} onChange={setValues} />
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-white disabled:opacity-60"
            >
              {pending ? "Certificando…" : "Confirmar e criar card"}
            </button>
            <span className="font-mono text-[11px] tracking-widest text-dim">N° {formatCollectionNumber(nextNumber)}</span>
          </div>
          <p aria-live="polite" className="mt-4 min-h-5 text-sm text-danger">
            {error}
          </p>
        </form>
      </div>
    </div>
  );
}
