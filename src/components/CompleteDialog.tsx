"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { completeEntry } from "@/app/actions/collection";
import type { CardPalette } from "@/db/schema";
import { certificationFor, formatCollectionNumber, TYPE_LABEL, type CardData } from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import { extractPalette } from "@/lib/palette";
import { ContentCard } from "./card/ContentCard";
import { useCardExport } from "./card/CardExport";
import { ActionButton } from "./CardLightbox";
import { EntryFields, todayISO, type EntryValues } from "./EntryForm";
import { CloseButton, Modal } from "./Modal";

/** The TMDB side of a card — what a title page knows before there is an entry. */
export type WorkForCard = Pick<
  CardData,
  | "contentType"
  | "contentId"
  | "title"
  | "startYear"
  | "endYear"
  | "seasons"
  | "runtime"
  | "genres"
  | "posterPath"
  | "backdropPath"
>;

type FlowProps = {
  work: WorkForCard;
  owner: { name: string; username: string };
  /** The in-progress entry being finished. Without it, the work is added and completed at once. */
  entry?: CardData;
  nextNumber: number;
  viewingNumber: number;
};

export function CompleteButton({
  label = "Marcar como concluído",
  variant = "primary",
  hideTrigger,
  ...flow
}: FlowProps & {
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
          className="inline-flex items-center gap-2.5 rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-white"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {label}
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="text-sm text-mute underline-offset-4 hover:text-paper hover:underline">
          {label}
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} label={`Concluir ${flow.work.title}`}>
        <CompleteFlow {...flow} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

/**
 * Completion: the black & white card comes alive (colour fades in), then the
 * user gives a rating and writes a reflection. Saving seals the card with
 * CERTIFIED (≥ 5.0) or NOT CERTIFIED (< 5.0).
 */
export function CompleteFlow({ work, owner, entry, nextNumber, viewingNumber, onClose }: FlowProps & { onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<EntryValues>({
    rating: 8,
    reflection: "",
    completedAt: todayISO(),
    isPublic: entry?.isPublic ?? true,
  });
  const [palette, setPalette] = useState<CardPalette | null>(entry?.palette ?? null);
  const [alive, setAlive] = useState(false);
  const [created, setCreated] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { exportCard, busy, stage } = useCardExport();

  useEffect(() => {
    const src = posterUrl(work.posterPath, "w185");
    if (src) extractPalette(src).then(setPalette).catch(() => setPalette(null));
  }, [work.posterPath]);

  // The card opens as it is (black & white) and gains colour a beat later
  useEffect(() => {
    const t = setTimeout(() => setAlive(true), 450);
    return () => clearTimeout(t);
  }, []);

  const preview: CardData = {
    ...work,
    entryId: entry?.entryId ?? "preview",
    status: alive ? "completed" : "in_progress",
    rating: alive ? values.rating : null,
    certification: alive ? certificationFor(values.rating) : null,
    reflection: values.reflection,
    addedAt: entry?.addedAt ?? new Date().toISOString(),
    completedAt: values.completedAt + "T12:00:00.000Z",
    collectionNumber: entry?.collectionNumber ?? nextNumber,
    viewingNumber: entry?.viewingNumber ?? viewingNumber,
    ownerName: owner.name,
    ownerUsername: owner.username,
    isFavorite: entry?.isFavorite ?? false,
    isPublic: values.isPublic,
    palette,
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await completeEntry({
        entryId: entry?.entryId,
        contentType: work.contentType,
        contentId: work.contentId,
        palette,
        ...values,
      });
      if (!res.ok) return setError(res.error);
      setCreated(res.data);
    });

  const close = () => {
    if (created) router.refresh();
    onClose();
  };

  if (created) {
    const certified = created.certification === "certified";
    return (
      <div data-backdrop className="flex min-h-dvh flex-col items-center justify-center gap-10 overflow-y-auto px-4 py-16">
        <CloseButton onClick={close} className="fixed right-4 top-4 sm:right-6 sm:top-6" />
        <div className="sc-reveal relative w-full max-w-[min(400px,72vw)]">
          <ContentCard card={created} posterSize="w780" priority />
        </div>
        <div className="relative text-center rise" style={{ animationDelay: "1.2s" }}>
          <p className="font-mono text-xs tracking-[0.3em] text-gold">
            N° {formatCollectionNumber(created.collectionNumber)} · {certified ? "Certified" : "Not certified"}
          </p>
          <p className="mx-auto mt-3 max-w-md font-serif text-3xl italic sm:text-4xl">
            {certified ? "Concluído e certificado." : "Concluído. Esta obra não recebeu sua certificação."}
          </p>
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

  const kind = TYPE_LABEL[work.contentType].one;
  const certifies = certificationFor(values.rating) === "certified";

  return (
    <div data-backdrop className="flex min-h-dvh items-start justify-center overflow-y-auto px-4 py-16 sm:items-center sm:px-8">
      <CloseButton onClick={close} className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6" />
      <div className="grid w-full max-w-5xl gap-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-16">
        {/* On phones the card comes first, smaller, so the moment it gains colour is seen */}
        <div className="mx-auto w-full max-w-[200px] sm:max-w-[260px] md:max-w-[380px]">
          <ContentCard card={preview} priority />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="eyebrow">{viewingNumber > 1 && !entry ? `Rewatch · ${viewingNumber}ª vez` : `Concluir ${kind}`}</p>
          <h2 className="mb-8 mt-3 font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">{work.title}</h2>
          <EntryFields values={values} onChange={setValues} />
          <p className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-mute" aria-live="polite">
            <span className={certifies ? "text-gold" : "text-paper/70"}>{certifies ? "✓ Certified" : "✕ Not certified"}</span>
            <span className="text-dim normal-case tracking-normal">
              {certifies ? "· nota 5.0 ou mais" : "· nota abaixo de 5.0"}
            </span>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-white disabled:opacity-60"
            >
              {pending ? "Salvando…" : "Concluir e salvar card"}
            </button>
            <span className="font-mono text-[11px] tracking-widest text-dim">
              N° {formatCollectionNumber(entry?.collectionNumber ?? nextNumber)}
            </span>
          </div>
          <p aria-live="polite" className="mt-4 min-h-5 text-sm text-danger">
            {error}
          </p>
        </form>
      </div>
    </div>
  );
}
