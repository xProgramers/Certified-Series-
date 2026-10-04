"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEntry, toggleFavorite, updateEntry } from "@/app/actions/collection";
import { formatCardDate, formatCollectionNumber, formatRating, type CardData } from "@/lib/card-types";
import { SeriesCard } from "./card/SeriesCard";
import { useCardExport, type ExportFormat } from "./card/CardExport";
import { EntryFields, type EntryValues } from "./EntryForm";
import { CloseButton, Modal } from "./Modal";

type Props = {
  card: CardData | null;
  isOwner: boolean;
  onClose: () => void;
  onChange?: (card: CardData) => void;
  onDelete?: (entryId: string) => void;
  /** Open straight into edit mode. */
  initialMode?: "view" | "edit";
};

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
  const [mode, setMode] = useState<"view" | "edit">(initialMode ?? "view");
  const [values, setValues] = useState<EntryValues>(() => valuesOf(initial));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { exportCard, busy, stage } = useCardExport();

  const preview: CardData = mode === "edit" ? { ...card, ...values, watchedAt: values.watchedAt + "T12:00:00.000Z" } : card;

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
      const res = await toggleFavorite(card.seriesId);
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
      setNotice(f === "story" ? "Imagem para Stories salva." : "Card salvo como PNG.");
    } catch {
      setError("Não foi possível gerar a imagem. Tente novamente.");
    }
  };

  return (
    <div data-backdrop className="flex min-h-dvh items-start justify-center overflow-y-auto px-4 py-16 sm:items-center sm:px-8">
      <CloseButton onClick={onClose} className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6" />
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,420px)_1fr] md:gap-14">
        <div className="mx-auto w-full max-w-[420px] rise">
          <SeriesCard card={preview} posterSize="w780" priority />
        </div>

        <div className="rise" style={{ animationDelay: "120ms" }}>
          {mode === "view" ? (
            <>
              <p className="eyebrow">
                N° {formatCollectionNumber(card.collectionNumber)} · concluída em {formatCardDate(card.watchedAt)}
                {!card.isPublic && " · privado"}
              </p>
              <h2 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight">{card.title}</h2>
              <p className="mt-3 font-mono text-sm text-mute">
                {formatRating(card.rating)} / 10{card.isFavorite && <span className="text-gold"> · ✦ favorita</span>}
              </p>
              {card.reflection && (
                <blockquote className="mt-8 border-l border-gold/40 pl-5 font-serif text-xl italic leading-relaxed text-paper/90">
                  {card.reflection}
                </blockquote>
              )}

              <div className="mt-10 space-y-3">
                <p className="eyebrow">Compartilhar</p>
                <div className="flex flex-wrap gap-2">
                  <ActionButton primary onClick={() => doExport("card")} disabled={!!busy}>
                    {busy === "card" ? "Gerando…" : "Salvar card (PNG)"}
                  </ActionButton>
                  <ActionButton onClick={() => doExport("story")} disabled={!!busy}>
                    {busy === "story" ? "Gerando…" : "Imagem para Stories"}
                  </ActionButton>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-6 text-sm">
                {isOwner && (
                  <>
                    <TextButton onClick={fav} disabled={pending}>
                      {card.isFavorite ? "✦ Remover dos favoritos" : "✧ Favoritar"}
                    </TextButton>
                    <TextButton onClick={() => setMode("edit")}>Editar nota e reflexão</TextButton>
                  </>
                )}
                <Link href={`/series/${card.seriesId}`} className="text-mute underline-offset-4 hover:text-paper hover:underline">
                  Ver série
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
        </div>
      </div>
      {stage}
    </div>
  );
}

function valuesOf(c: CardData): EntryValues {
  return { rating: c.rating, reflection: c.reflection, watchedAt: c.watchedAt.slice(0, 10), isPublic: c.isPublic };
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
          ? "bg-paper text-ink-0 hover:bg-white"
          : "border border-line-strong text-paper hover:border-gold/50 hover:bg-white/[0.03]"
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
