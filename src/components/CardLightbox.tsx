"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEntry, toggleFavorite, updateEntry } from "@/app/actions/collection";
import {
  cardDate,
  formatCardDate,
  formatCollectionNumber,
  formatRating,
  titleHref,
  TYPE_LABEL,
  type CardData,
} from "@/lib/card-types";
import { ContentCard } from "./card/ContentCard";
import { useCardExport, type ExportFormat } from "./card/CardExport";
import { CompleteFlow } from "./CompleteDialog";
import { EntryFields, todayISO, type EntryValues } from "./EntryForm";
import { CloseButton, Modal } from "./Modal";
import { SeasonChecklist } from "./SeasonChecklist";

type Props = {
  card: CardData | null;
  isOwner: boolean;
  onClose: () => void;
  onChange?: (card: CardData) => void;
  onDelete?: (entryId: string) => void;
  /** Open straight into edit mode. */
  initialMode?: "view" | "edit";
};

const NO_SEASONS: number[] = [];

export function CardLightbox({ card, isOwner, onClose, onChange, onDelete, initialMode = "view" }: Props) {
  return (
    <Modal open={!!card} onClose={onClose} label={card ? `Card de ${card.title}` : "Card"}>
      {card && (
        <LightboxBody
          key={card.entryId}
          card={card}
          isOwner={isOwner}
          onClose={onClose}
          onChange={onChange}
          onDelete={onDelete}
          initialMode={initialMode}
        />
      )}
    </Modal>
  );
}

function LightboxBody({ card: initial, isOwner, onClose, onChange, onDelete, initialMode }: Props & { card: CardData }) {
  const router = useRouter();
  const [card, setCard] = useState(initial);
  const [mode, setMode] = useState<"view" | "edit" | "complete">(initialMode ?? "view");
  const [values, setValues] = useState<EntryValues>(() => valuesOf(initial));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { exportCard, busy, stage, native } = useCardExport();

  const preview: CardData = mode === "edit" ? { ...card, ...values, completedAt: values.completedAt + "T12:00:00.000Z" } : card;
  const inProgress = card.status === "in_progress";
  // Rated series whose card went grey again: seasons left to mark, the rating is kept
  const pendingSeasons = inProgress && card.rating != null;
  const seasons = card.contentType === "series" ? (card.seasonList ?? []) : [];

  const commit = (next: CardData) => {
    setCard(next);
    onChange?.(next);
    router.refresh();
  };

  const save = () =>
    start(async () => {
      setError(null);
      const res = await updateEntry({ entryId: card.entryId, ...values });
      if (!res.ok) return setError(res.error);
      commit(res.data);
      setMode("view");
      setNotice("Card atualizado.");
    });

  const fav = () =>
    start(async () => {
      const res = await toggleFavorite({ contentType: card.contentType, contentId: card.contentId });
      if (!res.ok) return setError(res.error);
      commit({ ...card, isFavorite: res.data });
    });

  const remove = () => {
    if (!confirm(`Remover "${card.title}" da sua coleção? Esta ação não pode ser desfeita.`)) return;
    start(async () => {
      const res = await deleteEntry(card.entryId);
      if (!res.ok) return setError(res.error);
      onDelete?.(card.entryId);
      router.refresh();
      onClose();
    });
  };

  const doExport = async (f: ExportFormat) => {
    setError(null);
    try {
      await exportCard(card, f);
      if (!native) setNotice(f === "story" ? "Imagem para Stories salva." : "Card salvo como PNG.");
    } catch {
      setError("Não foi possível gerar a imagem. Tente novamente.");
    }
  };

  if (mode === "complete") {
    return (
      <CompleteFlow
        work={card}
        entry={card}
        owner={{ name: card.ownerName, username: card.ownerUsername }}
        nextNumber={card.collectionNumber}
        viewingNumber={card.viewingNumber}
        onClose={onClose}
      />
    );
  }

  return (
    <div data-backdrop className="flex min-h-dvh items-start justify-center overflow-y-auto px-4 py-16 sm:items-center sm:px-8">
      <CloseButton onClick={onClose} className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6" />
      {/* Taps on the empty space around the card close it too (Modal checks data-backdrop) */}
      <div data-backdrop className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,420px)_1fr] md:gap-14">
        <div className="mx-auto w-full max-w-[min(420px,78vw)] rise">
          <ContentCard card={preview} posterSize="w780" priority />
        </div>

        <div className="rise" style={{ animationDelay: "120ms" }}>
          {mode === "view" ? (
            <>
              <p className="eyebrow">
                N° {formatCollectionNumber(card.collectionNumber)} · {TYPE_LABEL[card.contentType].one} ·{" "}
                {pendingSeasons ? (card.newSeason ? "nova temporada" : "temporadas pendentes") : inProgress ? `em andamento desde ${formatCardDate(card.addedAt)}` : `concluído em ${formatCardDate(cardDate(card))}`}
                {!card.isPublic && " · privado"}
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">{card.title}</h2>
              <p className="mt-3 font-mono text-sm text-mute">
                {inProgress ? (
                  "In progress"
                ) : (
                  <>
                    {formatRating(card.rating ?? 0)} / 10 ·{" "}
                    <span className={card.certification === "certified" ? "text-gold" : "text-paper/70"}>
                      {card.certification === "certified" ? "✓ Certified" : "✕ Not certified"}
                    </span>
                  </>
                )}
                {card.isFavorite && <span className="text-gold"> · ✦ favorito</span>}
              </p>
              {!inProgress && card.reflection && (
                <blockquote className="mt-8 border-l border-gold/40 pl-5 font-serif text-xl italic leading-relaxed text-paper/90">
                  {card.reflection}
                </blockquote>
              )}

              {inProgress ? (
                isOwner && (
                  <div className="mt-10">
                    {seasons.length > 0 && (
                      <div className="mb-8">
                        <p className="eyebrow mb-3">
                          {card.newSeason ? "Nova temporada · marque quando terminar" : "Temporadas"}
                        </p>
                        <SeasonChecklist
                          compact
                          editable
                          contentId={card.contentId}
                          entryId={card.entryId}
                          seasons={seasons}
                          watched={card.watchedSeasons ?? NO_SEASONS}
                          onSaved={(next, allMarked) => {
                            commit(next);
                            if (allMarked && next.rating == null) setMode("complete");
                          }}
                        />
                      </div>
                    )}
                    {pendingSeasons ? (
                      <p className="text-sm text-dim">
                        Sua nota {formatRating(card.rating ?? 0)} continua guardada. Com todas as temporadas marcadas, o card volta a ter cor.
                      </p>
                    ) : (
                      <>
                        <ActionButton primary onClick={() => setMode("complete")}>
                          ✓ Marcar como concluído
                        </ActionButton>
                        <p className="mt-3 text-sm text-dim">
                          {seasons.length > 0
                            ? "Concluir marca todas as temporadas lançadas. O card ganha cor e recebe sua nota e reflexão."
                            : "Ao concluir, o card ganha cor e recebe sua nota e reflexão."}
                        </p>
                      </>
                    )}
                  </div>
                )
              ) : (
                <div className="mt-10 space-y-3">
                  <p className="eyebrow">Compartilhar</p>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton primary onClick={() => doExport("card")} disabled={!!busy}>
                      {busy === "card" ? "Gerando…" : native ? "Compartilhar card" : "Salvar card (PNG)"}
                    </ActionButton>
                    <ActionButton onClick={() => doExport("story")} disabled={!!busy}>
                      {busy === "story" ? "Gerando…" : native ? "Compartilhar nos Stories" : "Imagem para Stories"}
                    </ActionButton>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
                {isOwner && (
                  <>
                    <TextButton onClick={fav} disabled={pending}>
                      {card.isFavorite ? "✦ Remover dos favoritos" : "✧ Favoritar"}
                    </TextButton>
                    {!inProgress && <TextButton onClick={() => setMode("edit")}>Editar nota e reflexão</TextButton>}
                  </>
                )}
                <Link href={titleHref(card.contentType, card.contentId)} className="text-mute underline-offset-4 hover:text-paper hover:underline">
                  {card.contentType === "movie" ? "Ver filme" : "Ver série"}
                </Link>
                {isOwner && (
                  <TextButton onClick={remove} disabled={pending} danger>
                    Remover
                  </TextButton>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">Editando N° {formatCollectionNumber(card.collectionNumber)}</p>
              <h2 className="mb-8 mt-3 font-serif text-4xl leading-none tracking-tight">{card.title}</h2>
              <EntryFields values={values} onChange={setValues} />
              <div className="mt-8 flex gap-2">
                <ActionButton primary onClick={save} disabled={pending}>
                  {pending ? "Salvando…" : "Salvar alterações"}
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    setValues(valuesOf(card));
                    setMode("view");
                  }}
                  disabled={pending}
                >
                  Cancelar
                </ActionButton>
              </div>
            </>
          )}
          <div aria-live="polite" className="mt-4 min-h-6 text-sm">
            {error && <p className="text-danger">{error}</p>}
            {!error && notice && <p className="text-mute">{notice}</p>}
          </div>
          {/* Phones: a plain way back at the end of the details, within thumb reach */}
          <button
            type="button"
            onClick={onClose}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-line-strong py-3 text-sm text-mute transition-colors hover:text-paper md:hidden"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar
          </button>
        </div>
      </div>
      {stage}
    </div>
  );
}

function valuesOf(c: CardData): EntryValues {
  return {
    rating: c.rating ?? 8,
    reflection: c.reflection,
    completedAt: (c.completedAt ?? todayISO()).slice(0, 10),
    isPublic: c.isPublic,
  };
}

export function ActionButton({
  children,
  primary,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-full px-5 py-2.5 text-sm transition-all disabled:opacity-50 ${
        primary
          ? "bg-paper text-ink-0 hover:bg-hi"
          : "border border-line-strong text-paper hover:border-gold/50 hover:bg-paper/[0.03]"
      } ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

function TextButton({
  children,
  danger,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`underline-offset-4 transition-colors hover:underline disabled:opacity-50 ${
        danger ? "text-dim hover:text-danger" : "text-mute hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
