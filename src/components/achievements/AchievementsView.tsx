"use client";

import Link from "next/link";
import { useState } from "react";
import { ACHIEVEMENT_BY_KEY, TIER_LABEL, type AchievementKey } from "@/lib/achievements";
import { formatCardDate } from "@/lib/card-types";
import { CloseButton, Modal } from "../Modal";
import { Medal } from "./Medal";
import { MedalStage } from "./MedalStage";

/** One earned instance: which franchise/director/work, when, and the card that earned it. */
export type Instance = {
  label: string | null;
  earnedAt: string;
  /** Where the card lives; null when the card is private and the viewer is not its owner. */
  cardHref: string | null;
  cardTitle: string | null;
};

export type Tile = {
  key: AchievementKey;
  instances: Instance[];
  /** Share of collectors holding it (0–1); null while there are too few collectors to say. */
  share: number | null;
};

const FAMILIES = [
  {
    family: "obra",
    title: "Selos de obra",
    lede: "Ganhos por um card específico, e o selo aparece nele. Dá para ganhar o mesmo várias vezes: um por obra, franquia ou diretor.",
  },
  {
    family: "marco",
    title: "Marcos",
    lede: "Contam a coleção inteira e são ganhos uma vez só. O selo fica no card que fez você chegar lá.",
  },
] as const;

export function rarityWord(share: number) {
  if (share < 0.05) return "Lendária";
  if (share < 0.15) return "Rara";
  if (share < 0.4) return "Incomum";
  return "Comum";
}

export function AchievementsView({ tiles, isOwner }: { tiles: Tile[]; isOwner: boolean }) {
  const [open, setOpen] = useState<Tile | null>(null);
  let index = 0;

  return (
    <>
      <div className="space-y-20 sm:space-y-28">
        {FAMILIES.map(({ family, title, lede }) => {
          const list = tiles.filter((t) => ACHIEVEMENT_BY_KEY[t.key].family === family);
          const earned = list.filter((t) => t.instances.length).length;
          return (
            <section key={family} aria-labelledby={`fam-${family}`}>
              <header className="binder-head mb-3">
                <h2 id={`fam-${family}`} className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-none tracking-tight">
                  {title}
                </h2>
                <span className="binder-rule" aria-hidden />
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-dim sm:text-[11px]">
                  {earned} de {list.length}
                </p>
              </header>
              <p className="mb-10 text-sm text-mute sm:mb-14">{lede}</p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {list.map((t) => {
                  const i = index++;
                  return (
                    <li key={t.key} className="rise" style={{ animationDelay: `${Math.min(i * 60, 700)}ms` }}>
                      <TileButton tile={t} onOpen={() => setOpen(t)} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} label={open ? ACHIEVEMENT_BY_KEY[open.key].name : "Conquista"}>
        {open && <Detail tile={open} isOwner={isOwner} onClose={() => setOpen(null)} />}
      </Modal>
    </>
  );
}

function TileButton({ tile, onOpen }: { tile: Tile; onOpen: () => void }) {
  const def = ACHIEVEMENT_BY_KEY[tile.key];
  const earned = tile.instances.length > 0;
  const hidden = !earned && def.secret;
  const labels = tile.instances.map((x) => x.label ?? x.cardTitle).filter(Boolean) as string[];
  return (
    <button type="button" onClick={onOpen} className="group flex w-full flex-col items-center text-center">
      <span className={`relative block w-[min(100%,168px)] ${earned ? "" : "opacity-70"}`}>
        <MedalStage achievement={tile.key} locked={!earned} spin={false} />
        {tile.instances.length > 1 && (
          <span className="absolute right-0 top-1 rounded-full border border-line-strong bg-ink-1/90 px-2 py-0.5 font-mono text-[11px] text-paper backdrop-blur">
            ×{tile.instances.length}
          </span>
        )}
      </span>
      <span className={`mt-5 font-serif text-2xl leading-none tracking-tight ${earned ? "text-paper" : "text-mute"}`}>
        {hidden ? "Conquista secreta" : def.name}
      </span>
      <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-dim">
        {earned
          ? `${TIER_LABEL[def.tier]} · ${formatCardDate(tile.instances[0].earnedAt)}`
          : hidden
            ? "Descubra assistindo"
            : TIER_LABEL[def.tier]}
      </span>
      {earned && labels.length > 0 ? (
        <span className="mt-2 line-clamp-2 max-w-[22ch] text-[13px] leading-snug text-mute">{labels.join(" · ")}</span>
      ) : (
        <span className="mt-2 max-w-[24ch] text-[13px] leading-snug text-dim">{hidden ? def.hint : def.rule}</span>
      )}
      <span className="mt-2 text-[12px] text-dim underline decoration-line-strong underline-offset-4 transition-colors group-hover:text-paper">
        Como ganhar
      </span>
    </button>
  );
}

function Detail({ tile, isOwner, onClose }: { tile: Tile; isOwner: boolean; onClose: () => void }) {
  const def = ACHIEVEMENT_BY_KEY[tile.key];
  const earned = tile.instances.length > 0;
  const hidden = !earned && def.secret;
  return (
    <div data-backdrop className="flex min-h-dvh items-center justify-center overflow-y-auto px-4 py-16">
      <CloseButton onClick={onClose} className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6" />
      <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-[minmax(0,360px)_1fr] md:gap-16">
        <div className="mx-auto w-full max-w-[min(320px,70vw)]">
          <MedalStage achievement={tile.key} locked={!earned} engraved={hidden ? undefined : def.name} />
        </div>
        <div className="rise text-center md:text-left" style={{ animationDelay: "0.5s" }}>
          <p className="eyebrow">
            {def.family === "obra" ? "Selo de obra" : "Marco"} · {TIER_LABEL[def.tier]}
            {tile.share != null && earned ? ` · ${rarityWord(tile.share)}` : ""}
          </p>
          <h2 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            {hidden ? "Conquista secreta" : def.name}
          </h2>
          <p className="mx-auto mt-5 max-w-md font-serif text-xl italic leading-snug text-mute md:mx-0">
            {hidden ? "Algumas coisas só se revelam depois dos créditos." : def.story}
          </p>
          <HowTo achievement={tile.key} hidden={!!hidden} />
          {tile.share != null && (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">
              {Math.max(1, Math.round(tile.share * 100))}% dos colecionadores têm
            </p>
          )}

          {earned ? (
            <ul className="mt-8 divide-y divide-line border-y border-line text-left">
              {tile.instances.map((x, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="min-w-0">
                    {x.label && <span className="block truncate text-paper">{x.label}</span>}
                    {x.cardTitle &&
                      (x.cardHref ? (
                        <Link href={x.cardHref} onClick={onClose} className="text-sm text-mute underline-offset-4 hover:text-paper hover:underline">
                          com {x.cardTitle}
                        </Link>
                      ) : (
                        <span className="text-sm text-mute">com {x.cardTitle}</span>
                      ))}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tracking-[0.18em] text-dim">{formatCardDate(x.earnedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.24em] text-dim">
              {isOwner ? "Ainda não conquistada" : "Ainda não conquistada por esta coleção"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** The rule, a worked example and the fine print: what it takes, without guessing. */
function HowTo({ achievement, hidden }: { achievement: AchievementKey; hidden: boolean }) {
  const def = ACHIEVEMENT_BY_KEY[achievement];
  return (
    <div className="mx-auto mt-7 max-w-md rounded-2xl border border-line bg-ink-1/60 p-5 text-left md:mx-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">Como ganhar</p>
      {hidden ? (
        <p className="mt-2 text-[15px] leading-snug text-paper">
          É secreta: a regra aparece quando você a conquistar. Dica: {def.hint?.toLowerCase()}
        </p>
      ) : (
        <>
          <p className="mt-2 text-[15px] leading-snug text-paper">{def.rule}</p>
          <p className="mt-3 text-sm leading-snug text-mute">
            <span className="text-dim">Exemplo: </span>
            {def.example}
          </p>
          {def.note && <p className="mt-2 text-sm leading-snug text-dim">{def.note}</p>}
        </>
      )}
    </div>
  );
}

/** A row of the most prestigious seals, for the profile header. */
export function MedalRow({ keys }: { keys: AchievementKey[] }) {
  return (
    <span className="flex -space-x-1.5">
      {keys.map((k) => (
        <Medal key={k} achievement={k} className="h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
      ))}
    </span>
  );
}
