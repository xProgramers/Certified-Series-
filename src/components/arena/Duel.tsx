"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { playRound, startMatch } from "@/app/actions/arena";
import { ELEMENT_LABEL } from "@/lib/arena";
import { roundKind, ROUNDS, score, type MatchOutcome, type RoundKind, type RoundResult } from "@/lib/arena-game";
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

const KIND_TITLE: Record<RoundKind, string> = { attack: "Você ataca", defend: "Você defende", climax: "Clímax" };
const KIND_HINT: Record<RoundKind, string> = {
  attack: "Seu Power contra a Defense deles. Empate fica com quem defende.",
  defend: "Sua Defense contra o Power deles. Empate fica com você.",
  climax: "Última carta: Power + Defense somados.",
};

function resultLine(r: RoundResult) {
  if (r.kind === "attack") return r.winner === 1 ? "Ataque confirmado" : "Ataque defendido";
  if (r.kind === "defend") return r.winner === 1 ? "Defesa segurou" : "Defesa rompida";
  return r.winner === 1 ? "Clímax é seu" : r.winner === -1 ? "Clímax perdido" : "Clímax empatado";
}

const OUTCOME_TITLE: Record<MatchOutcome, string> = { won: "Vitória", lost: "Derrota", draw: "Empate" };

/** The duel: a dark stage, the two cards of the round in the middle, the hand below. */
export function Duel({ matchId, challenge, playerName, playerCards, opponentCards, initialRounds, initialStatus }: Props) {
  const router = useRouter();
  const [rounds, setRounds] = useState(initialRounds);
  const [status, setStatus] = useState(initialStatus);
  const [phase, setPhase] = useState<Phase>(initialStatus === "playing" ? "choose" : "over");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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
      const res = await startMatch({ entryIds: playerCards.map((c) => c.entryId), challenge: challenge.key });
      if (res.ok) router.push(`/arena/partida/${res.data.id}`);
      else setError(res.error);
    });

  return (
    <div className="duel">
      <div className="duel-beams" aria-hidden />

      <header className="duel-top">
        <div className="duel-player">
          <Link href="/arena" className="duel-exit" aria-label="Sair da partida">
            ✕
          </Link>
          <span className="duel-avatar">{playerName[0]}</span>
          <div className="min-w-0">
            <p className="duel-kicker">Você</p>
            <p className="duel-name">{playerName}</p>
          </div>
        </div>
        <div className="duel-score">
          <p className="duel-kicker">
            {phase === "over" ? "Fim de jogo" : `Rodada ${i + 1} de ${ROUNDS}`}
          </p>
          <div className="duel-board" aria-label={`Placar: você ${s.player}, desafio ${s.opponent}`}>
            <b>{s.player}</b>
            <span>×</span>
            <b>{s.opponent}</b>
          </div>
          <div className="duel-pips" aria-hidden>
            {Array.from({ length: ROUNDS }, (_, k) => {
              const r = rounds[k];
              const cls = r ? (r.winner === 1 ? "is-win" : r.winner === -1 ? "is-loss" : "is-tie") : k === rounds.length && phase === "choose" ? "is-now" : "";
              return <i key={k} className={`${cls} ${k === ROUNDS - 1 ? "is-climax" : ""}`} />;
            })}
          </div>
        </div>
        <div className="duel-player justify-end text-right">
          <div className="min-w-0">
            <p className="duel-kicker">Desafio</p>
            <p className="duel-name">{challenge.name}</p>
          </div>
          <span className="duel-avatar is-them">
            {challenge.element ? <ElementGlyph element={challenge.element} className="h-5 w-5" /> : "★"}
          </span>
        </div>
      </header>

      <div className="duel-opp-hand" aria-label="Cartas do desafio">
        {opponentCards.map((c) => (
          <div key={c.entryId} className={`duel-mini ${usedTheirs.has(c.entryId) ? "is-used" : ""}`}>
            {usedTheirs.has(c.entryId) ? <ArenaCardBack card={c} /> : <FaceDown />}
          </div>
        ))}
      </div>

      <main className="duel-stage">
        <div className="duel-card is-left">
          {current ? (
            <>
              <div className="duel-card-tag">{tagFor(current.kind, true)}</div>
              <ArenaCardBack card={mine(current.playerKey)} />
            </>
          ) : choice ? (
            <>
              <div className="duel-card-tag">{tagFor(kind, true)}</div>
              <ArenaCardBack card={choice} />
            </>
          ) : (
            <div className="duel-slot">
              <span>Escolha uma carta da sua mão</span>
            </div>
          )}
        </div>

        <div className="duel-clash">
          {current ? (
            <Clash r={current} me={mine(current.playerKey)} them={theirs(current.opponentKey)} />
          ) : (
            <div className="duel-prompt">
              <p className="duel-kicker">{phase === "over" ? "" : `Rodada ${i + 1}`}</p>
              <h2>{KIND_TITLE[kind]}</h2>
              <p className="duel-hint">{KIND_HINT[kind]}</p>
            </div>
          )}
          {phase === "choose" && (
            <button type="button" className="duel-cta" onClick={play} disabled={!selected || pending}>
              {pending ? "Revelando…" : selected ? "Jogar carta" : "Escolha uma carta"}
            </button>
          )}
          {phase === "reveal" && (
            <button type="button" className="duel-cta" onClick={next}>
              {status === "playing" ? "Próxima rodada" : "Ver resultado"}
            </button>
          )}
          {error && (
            <p role="alert" className="duel-error">
              {error}
            </p>
          )}
        </div>

        <div className="duel-card is-right">
          {current ? (
            <div className="duel-reveal">
              <div className="duel-card-tag">{tagFor(current.kind, false)}</div>
              <ArenaCardBack card={theirs(current.opponentKey)} />
            </div>
          ) : (
            <>
              <div className="duel-card-tag">Carta do desafio</div>
              <FaceDown />
            </>
          )}
        </div>
      </main>

      <footer className="duel-hand-wrap">
        <div className="duel-hand" role="group" aria-label="Sua mão">
          {playerCards.map((c, k) => {
            const used = usedMine.has(c.entryId);
            const on = selected === c.entryId;
            return (
              <button
                key={c.entryId}
                type="button"
                disabled={used || phase !== "choose" || pending}
                onClick={() => setSelected(on ? null : c.entryId)}
                aria-pressed={on}
                aria-label={`${c.title}${used ? ", já usada" : ""}`}
                className={`duel-hand-card ${used ? "is-used" : ""} ${on ? "is-on" : ""}`}
                style={{ ["--i" as string]: k - (playerCards.length - 1) / 2 }}
              >
                <ArenaCardBack card={c} />
              </button>
            );
          })}
        </div>
      </footer>

      {phase === "over" && status !== "playing" && (
        <div className="duel-over" role="dialog" aria-modal="true" aria-labelledby="duel-over-title">
          <div className="duel-over-box">
            <p className="duel-kicker">{challenge.name}</p>
            <h2 id="duel-over-title" className={`duel-over-title is-${status}`}>
              {OUTCOME_TITLE[status]}
            </h2>
            <p className="duel-over-score">
              <span>Você</span> {s.player} × {s.opponent} <span>Desafio</span>
            </p>
            <ol className="duel-over-rounds">
              {rounds.map((r, k) => (
                <li key={k} className={r.winner === 1 ? "is-win" : r.winner === -1 ? "is-loss" : ""}>
                  <span>{k + 1}</span>
                  <span className="truncate">{mine(r.playerKey).title}</span>
                  <b>
                    {r.playerValue} × {r.opponentValue}
                  </b>
                  <span className="truncate text-right">{theirs(r.opponentKey).title}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={rematch} disabled={pending} className="rounded-full bg-[#ece7df] px-5 py-2.5 text-sm text-[#0a0a0b] hover:bg-white disabled:opacity-50">
                {pending ? "Montando a mesa…" : "Jogar de novo"}
              </button>
              <Link href="/arena" className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-[#ece7df] hover:border-white/40">
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

function Clash({ r, me, them }: { r: RoundResult; me: CardData; them: CardData }) {
  const label = (mine: boolean) => {
    if (r.kind === "climax") return "Total";
    const power = (r.kind === "attack") === mine;
    return power ? "Power" : "Defense";
  };
  const icon = (mine: boolean) => ((r.kind === "attack") === mine ? "power" : "defense") as "power" | "defense";
  const calc = (mine: boolean) => {
    const bonus = mine ? r.playerBonus : r.opponentBonus;
    const value = mine ? r.playerValue : r.opponentValue;
    const own = mine ? me.arena! : them.arena!;
    const other = mine ? them.arena! : me.arena!;
    if (!bonus) return "sem vantagem";
    return `${value - bonus} + ${bonus} · ${ELEMENT_LABEL[own.element]} vence ${ELEMENT_LABEL[other.element]}`;
  };
  return (
    <div className="duel-clash-row">
      <div className={`duel-side ${r.winner === 1 ? "is-winner" : ""}`}>
        <span className="duel-stat-label">
          {r.kind !== "climax" && <StatIcon kind={icon(true)} />} {label(true)}
        </span>
        <b className="duel-big">{r.playerValue}</b>
        <span className="duel-calc">{calc(true)}</span>
      </div>
      <div className="duel-vs">vs</div>
      <div className={`duel-side ${r.winner === -1 ? "is-winner" : ""}`}>
        <span className="duel-stat-label">
          {r.kind !== "climax" && <StatIcon kind={icon(false)} />} {label(false)}
        </span>
        <b className="duel-big is-them">{r.opponentValue}</b>
        <span className="duel-calc">{calc(false)}</span>
      </div>
      <div className={`duel-result ${r.winner === 1 ? "is-win" : r.winner === -1 ? "is-loss" : ""}`}>{resultLine(r)}</div>
    </div>
  );
}

function FaceDown() {
  return (
    <div className="sc-frame">
      <div className="sc duel-facedown">
        <div className="duel-facedown-seal">
          <LogoMark className="h-full w-full" />
        </div>
        <div className="sc-grain" />
        <div className="sc-edge" />
      </div>
    </div>
  );
}
