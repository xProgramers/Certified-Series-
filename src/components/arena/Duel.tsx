"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { playRound, startMatch } from "@/app/actions/arena";
import { ELEMENT_LABEL } from "@/lib/arena";
import {
  roundKind,
  ROUNDS,
  score,
  type MatchOutcome,
  type RoundKind,
  type RoundResult,
} from "@/lib/arena-game";
import type { Challenge } from "@/lib/arena-server";
import type { CardData } from "@/lib/card-types";
import { LogoMark } from "../Logo";
import { ArenaCardBack, ElementGlyph, StatIcon } from "../card/ArenaCardBack";

type Props = {
  matchId: string;
  challenge: Challenge;
  playerName: string;
  playerCards: CardData[];
  opponentCards: CardData[];
  initialRounds: RoundResult[];
  initialStatus: "playing" | MatchOutcome;
};

type Phase = "choose" | "reveal" | "over";

const KIND_TITLE: Record<RoundKind, string> = {
  attack: "Você ataca",
  defend: "Você defende",
  climax: "Clímax",
};
const KIND_HINT: Record<RoundKind, string> = {
  attack: "Seu Power contra a Defense deles. Empate fica com quem defende.",
  defend: "Sua Defense contra o Power deles. Empate fica com você.",
  climax: "Última carta: Power + Defense somados.",
};

function resultLine(r: RoundResult) {
  if (r.kind === "attack")
    return r.winner === 1 ? "Ataque confirmado" : "Ataque defendido";
  if (r.kind === "defend")
    return r.winner === 1 ? "Defesa segurou" : "Defesa rompida";
  return r.winner === 1
    ? "Clímax é seu"
    : r.winner === -1
      ? "Clímax perdido"
      : "Clímax empatado";
}

const OUTCOME_TITLE: Record<MatchOutcome, string> = {
  won: "Vitória",
  lost: "Derrota",
  draw: "Empate",
};

/** The duel: a dark stage, the two cards of the round in the middle, the hand below. */
export function Duel({
  matchId,
  challenge,
  playerName,
  playerCards,
  opponentCards,
  initialRounds,
  initialStatus,
}: Props) {
  const router = useRouter();
  const [rounds, setRounds] = useState(initialRounds);
  const [status, setStatus] = useState(initialStatus);
  const [phase, setPhase] = useState<Phase>(
    initialStatus === "playing" ? "choose" : "over",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // The duel is a full-screen game: park the page underneath and stop it scrolling.
  useEffect(() => {
    window.scrollTo(0, 0);
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  const s = score(rounds);
  const last = rounds.at(-1) ?? null;
  const current = phase === "reveal" && last ? last : null;
  const i = phase === "choose" ? rounds.length : rounds.length - 1;
  const kind = roundKind(Math.min(i, ROUNDS - 1));
  const usedMine = new Set(rounds.map((r) => r.playerKey));
  const usedTheirs = new Set(rounds.map((r) => r.opponentKey));
  const mine = (key: string) => playerCards.find((c) => c.entryId === key)!;
  const theirs = (key: string) => opponentCards.find((c) => c.entryId === key)!;
  const choice = selected ? mine(selected) : null;

  const play = () => {
    if (!selected) return;
    setError(null);
    start(async () => {
      const res = await playRound(matchId, selected);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRounds((r) => [...r, res.data.round]);
      setStatus(res.data.status as Props["initialStatus"]);
      setSelected(null);
      setPhase("reveal");
    });
  };

  const next = () => setPhase(status === "playing" ? "choose" : "over");

  const rematch = () =>
    start(async () => {
      const res = await startMatch({
        entryIds: playerCards.map((c) => c.entryId),
        challenge: challenge.key,
      });
      if (res.ok) router.push(`/arena/partida/${res.data.id}`);
      else setError(res.error);
    });

  const hand = playerCards.filter((c) => !usedMine.has(c.entryId));
  const theirHand = opponentCards.filter((c) => !usedTheirs.has(c.entryId));
  const outcome = current
    ? current.winner === 1
      ? "win"
      : current.winner === -1
        ? "loss"
        : "tie"
    : null;
  const myCard = current ? mine(current.playerKey) : choice;
  const cta =
    phase === "choose"
      ? {
          top: pending ? "…" : "Jogar",
          sub: pending ? "Revelando" : "Carta",
          onClick: play,
          disabled: !selected || pending,
        }
      : phase === "reveal"
        ? status === "playing"
          ? {
              top: "Seguir",
              sub: `Rodada ${rounds.length + 1}`,
              onClick: next,
              disabled: false,
            }
          : {
              top: "Final",
              sub: "Resultado",
              onClick: next,
              disabled: false,
            }
        : null;
  const nextKind =
    phase === "reveal" && status === "playing"
      ? roundKind(rounds.length)
      : null;

  return (
    <div className="duel">
      <div className="duel-scene" aria-hidden>
        <div className="duel-marquee" />
        <div className="duel-beams" />
        <div className="duel-curtain is-left" />
        <div className="duel-curtain is-right" />
        <div className="duel-valance" />
      </div>

      <div className="duel-box">
        <Link href="/arena" className="duel-exit" aria-label="Sair da partida">
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </Link>

        <div
          className="duel-opp-hand"
          aria-label={`O desafio tem ${theirHand.length} cartas na mão`}
        >
          {theirHand.map((c, k) => (
            <div
              key={c.entryId}
              className="duel-opp-card"
              style={{ ["--i" as string]: k - (theirHand.length - 1) / 2 }}
            >
              <FaceDown />
            </div>
          ))}
        </div>

        <section className="duel-hud is-them" aria-label="Desafio">
          <Medal tone="them">
            {challenge.element ? (
              <ElementGlyph
                element={challenge.element}
                className="duel-medal-glyph"
              />
            ) : (
              <span className="duel-medal-letter">★</span>
            )}
          </Medal>
          <div className="duel-hud-text">
            <p className="duel-hud-name">{challenge.name}</p>
            <p className="duel-hud-sub">Desafio</p>
            <Lamps lit={s.opponent} tone="them" />
          </div>
        </section>

        <ol
          className="duel-reel"
          aria-label={
            phase === "over" ? "Fim de jogo" : `Rodada ${i + 1} de ${ROUNDS}`
          }
        >
          {Array.from({ length: ROUNDS }, (_, k) => {
            const r = rounds[k];
            const state = r
              ? r.winner === 1
                ? "is-win"
                : r.winner === -1
                  ? "is-loss"
                  : "is-tie"
              : k === rounds.length && phase === "choose"
                ? "is-now"
                : "";
            return (
              <li key={k} className={state}>
                {k === ROUNDS - 1 ? "★" : k + 1}
              </li>
            );
          })}
        </ol>

        <main
          className={`duel-table ${current ? `is-reveal is-${outcome}` : ""}`}
        >
          <div className="duel-burst" aria-hidden>
            {current && outcome !== "tie" && (
              <>
                <i className="duel-rays" />
                <i className="duel-flash" />
                {Array.from({ length: 18 }, (_, k) => (
                  <i
                    key={k}
                    className="duel-spark"
                    style={{ ["--k" as string]: k }}
                  />
                ))}
              </>
            )}
          </div>

          <div className="duel-head">
            {current ? (
              <Clash r={current} n={rounds.length} />
            ) : (
              <>
                <p className="duel-round">
                  {phase === "over"
                    ? "Fim de jogo"
                    : `Rodada ${i + 1} de ${ROUNDS}`}
                </p>
                <h2 className="duel-title">{KIND_TITLE[kind]}</h2>
              </>
            )}
          </div>

          <div
            className={`duel-slot is-me ${current && current.winner === 1 ? "is-winner" : ""} ${current && current.winner === -1 ? "is-loser" : ""}`}
          >
            {myCard ? (
              <>
                <span className="duel-tag">
                  {statTag(current?.kind ?? kind, true, current, true)}
                </span>
                <div
                  className={`duel-slot-card ${current ? "" : "is-preview"}`}
                >
                  <ArenaCardBack card={myCard} />
                </div>
                {current?.playerBonus ? (
                  <Advantage
                    me={mine(current.playerKey)}
                    them={theirs(current.opponentKey)}
                    bonus={current.playerBonus}
                  />
                ) : null}
              </>
            ) : (
              <div className="duel-drop">
                <StatIcon kind={kind === "defend" ? "defense" : "power"} />
                <b>{tagFor(kind, true)}</b>
                <span>Escolha uma carta da sua mão</span>
              </div>
            )}
            <span className="duel-slot-label">Você</span>
          </div>

          <div className="duel-vs" aria-hidden>
            <span>VS</span>
          </div>

          <div
            className={`duel-slot is-them ${current && current.winner === -1 ? "is-winner" : ""} ${current && current.winner === 1 ? "is-loser" : ""}`}
          >
            {current ? (
              <>
                <span className="duel-tag is-them">
                  {statTag(current.kind, false, current, true)}
                </span>
                <div className="duel-slot-card duel-reveal">
                  <ArenaCardBack card={theirs(current.opponentKey)} />
                  {current.winner === 1 && <Crack />}
                </div>
                {current.opponentBonus ? (
                  <Advantage
                    me={theirs(current.opponentKey)}
                    them={mine(current.playerKey)}
                    bonus={current.opponentBonus}
                  />
                ) : null}
              </>
            ) : (
              <>
                {phase === "choose" && (
                  <span className="duel-tag is-them">Pronta</span>
                )}
                <div className="duel-slot-card">
                  <FaceDown />
                </div>
              </>
            )}
            <span className="duel-slot-label is-them">Desafio</span>
          </div>

          <div className="duel-foot">
            {current ? (
              <>
                <div className={`duel-ribbon is-${outcome}`}>
                  <span>
                    {outcome === "win"
                      ? "Você venceu a rodada"
                      : outcome === "loss"
                        ? "O desafio levou a rodada"
                        : "Rodada empatada"}
                  </span>
                </div>
                <p className="duel-hint">{resultLine(current)}</p>
              </>
            ) : (
              phase === "choose" && (
                <p className="duel-hint">{KIND_HINT[kind]}</p>
              )
            )}
            {error && (
              <p role="alert" className="duel-error">
                {error}
              </p>
            )}
          </div>
        </main>

        <section className="duel-hud is-me" aria-label="Você">
          <Medal tone="me">
            <span className="duel-medal-letter">{playerName[0]}</span>
          </Medal>
          <div className="duel-hud-text">
            <p className="duel-hud-name">{playerName}</p>
            <p className="duel-hud-sub">
              {hand.length} {hand.length === 1 ? "carta" : "cartas"} na mão ·{" "}
              {usedMine.size} {usedMine.size === 1 ? "usada" : "usadas"}
            </p>
            <Lamps lit={s.player} tone="me" />
          </div>
        </section>

        <div className="duel-hand" role="group" aria-label="Sua mão">
          {hand.map((c, k) => {
            const on = selected === c.entryId;
            return (
              <button
                key={c.entryId}
                type="button"
                disabled={phase !== "choose" || pending}
                onClick={() => setSelected(on ? null : c.entryId)}
                aria-pressed={on}
                aria-label={c.title}
                className={`duel-hand-card ${on ? "is-on" : ""}`}
                style={{
                  ["--i" as string]: k - (hand.length - 1) / 2,
                  ["--n" as string]: hand.length,
                }}
              >
                <ArenaCardBack card={c} />
              </button>
            );
          })}
        </div>

        {cta && (
          <div className="duel-action">
            <button
              type="button"
              className="duel-seal"
              onClick={cta.onClick}
              disabled={cta.disabled}
            >
              <b>{cta.top}</b>
              <span>{cta.sub}</span>
            </button>
            <p className="duel-action-hint">
              {phase === "choose"
                ? selected
                  ? "Revele sua carta"
                  : "Escolha uma carta"
                : nextKind
                  ? KIND_TITLE[nextKind]
                  : "Fim da partida"}
            </p>
          </div>
        )}
      </div>

      {phase === "over" && status !== "playing" && (
        <div
          className="duel-over"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duel-over-title"
        >
          <div className="duel-over-box">
            <p className="duel-round">{challenge.name}</p>
            <h2 id="duel-over-title" className={`duel-over-title is-${status}`}>
              {OUTCOME_TITLE[status]}
            </h2>
            <p className="duel-over-score">
              <span>Você</span> {s.player} × {s.opponent} <span>Desafio</span>
            </p>
            <ol className="duel-over-rounds">
              {rounds.map((r, k) => (
                <li
                  key={k}
                  className={
                    r.winner === 1 ? "is-win" : r.winner === -1 ? "is-loss" : ""
                  }
                >
                  <span>{k + 1}</span>
                  <span className="truncate">{mine(r.playerKey).title}</span>
                  <b>
                    {r.playerValue} × {r.opponentValue}
                  </b>
                  <span className="truncate text-right">
                    {theirs(r.opponentKey).title}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={rematch}
                disabled={pending}
                className="duel-over-cta"
              >
                {pending ? "Montando a mesa…" : "Jogar de novo"}
              </button>
              <Link href="/arena" className="duel-over-link">
                Trocar deck ou desafio
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function tagFor(kind: RoundKind, mine: boolean) {
  if (kind === "climax") return "Power + Defense";
  const attacking = (kind === "attack") === mine;
  return attacking ? "Ataca com Power" : "Defende com Defense";
}

/** Which stat a card fights with this round, with its value once revealed. */
function statTag(
  kind: RoundKind,
  mine: boolean,
  r: RoundResult | null,
  withValue: boolean,
) {
  if (kind === "climax")
    return r && withValue
      ? `Total ${mine ? r.playerValue - r.playerBonus : r.opponentValue - r.opponentBonus}`
      : "Power + Defense";
  const power = (kind === "attack") === mine;
  const name = power ? "Power" : "Defense";
  if (!r || !withValue) return tagFor(kind, mine);
  return `${name} ${mine ? r.playerValue - r.playerBonus : r.opponentValue - r.opponentBonus}`;
}

/** Counts up to the value, like a scoreboard; instant when motion is reduced. */
function useCountUp(value: number, delay = 250, ms = 700) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const p = instant ? 1 : Math.min(1, Math.max(0, (t - t0) / ms));
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay, ms]);
  return n;
}

function Clash({ r, n }: { r: RoundResult; n: number }) {
  const mineN = useCountUp(r.playerValue);
  const theirsN = useCountUp(r.opponentValue);
  const calc = (value: number, bonus: number) =>
    bonus ? `${value - bonus} + ${bonus}` : " ";
  return (
    <div
      className="duel-clash"
      aria-label={`Rodada ${n}: você ${r.playerValue}, desafio ${r.opponentValue}`}
    >
      <p className="duel-round">
        {r.kind === "climax" ? "Clímax" : `Rodada ${n}`}
      </p>
      <div className={`duel-nums ${Math.max(r.playerValue, r.opponentValue) >= 100 ? "is-long" : ""}`}>
        <div className={`duel-num is-me ${r.winner === 1 ? "is-winner" : ""}`}>
          <span className="duel-calc">
            {calc(r.playerValue, r.playerBonus)}
          </span>
          <b>{mineN}</b>
        </div>
        <div
          className={`duel-num is-them ${r.winner === -1 ? "is-winner" : ""}`}
        >
          <span className="duel-calc">
            {calc(r.opponentValue, r.opponentBonus)}
          </span>
          <b>{theirsN}</b>
        </div>
      </div>
    </div>
  );
}

function Advantage({
  me,
  them,
  bonus,
}: {
  me: CardData;
  them: CardData;
  bonus: number;
}) {
  return (
    <span className="duel-adv">
      {ELEMENT_LABEL[me.arena!.element]} › {ELEMENT_LABEL[them.arena!.element]}{" "}
      +{bonus}
    </span>
  );
}

function Medal({
  tone,
  children,
}: {
  tone: "me" | "them";
  children: React.ReactNode;
}) {
  return (
    <span className={`duel-medal is-${tone}`} aria-hidden>
      {children}
    </span>
  );
}

/** Three diamond lamps; one lights up per round won. */
function Lamps({ lit, tone }: { lit: number; tone: "me" | "them" }) {
  return (
    <span
      className={`duel-lamps is-${tone}`}
      aria-label={`${lit} ${lit === 1 ? "rodada vencida" : "rodadas vencidas"}`}
    >
      {Array.from({ length: 3 }, (_, k) => (
        <i key={k} className={k < lit ? "is-on" : ""} />
      ))}
    </span>
  );
}

function Crack() {
  return (
    <svg
      className="duel-crack"
      viewBox="0 0 100 160"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d="M20 10 L38 42 L30 58 L56 86 L48 106 L76 140 M38 42 L60 46 M56 86 L82 82" />
    </svg>
  );
}

function FaceDown() {
  return (
    <div className="sc-frame">
      <div className="sc duel-facedown">
        <div className="duel-facedown-frame" />
        <div className="duel-facedown-seal">
          <LogoMark className="h-full w-full" />
        </div>
        <span className="duel-facedown-word">Certified</span>
        <div className="sc-edge" />
      </div>
    </div>
  );
}
