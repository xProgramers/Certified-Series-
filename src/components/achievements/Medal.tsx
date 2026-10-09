import { useId, type ReactNode } from "react";
import { ACHIEVEMENT_BY_KEY, type AchievementKey, type MedalShape, type Tier } from "@/lib/achievements";

/**
 * The achievement seal: a struck medal drawn in SVG, so it stays sharp from a
 * 16px seal on a card to a 320px piece on the achievements page, and exports
 * with the card to PNG.
 *
 * Built like a real medal, in layers:
 *   rim (polished metal) → bevel (the same metal catching light the other way)
 *   → enamel field → engraved emblem → sheen
 * The metal says the tier (bronze, silver, gold, platinum), the silhouette
 * says the family (coin = one work, rosette = a body of work, octagon = a
 * milestone) and the emblem says the story. Locked seals are cast in graphite.
 */

type Metal = { stops: string[]; field: [string, string]; ink: string };

const METALS: Record<Tier | "locked", Metal> = {
  bronze: {
    stops: ["#4a2c17", "#a8743f", "#f3c896", "#8f5a2e", "#d7a26c", "#3e2412"],
    field: ["#2b1910", "#0d0705"],
    ink: "#f0c590",
  },
  silver: {
    stops: ["#3d434c", "#b9bfc8", "#ffffff", "#848b95", "#e2e6ec", "#30353c"],
    field: ["#1b2330", "#07090d"],
    ink: "#eef2f7",
  },
  gold: {
    stops: ["#4f3810", "#c19a45", "#fff0bf", "#9a742a", "#ebcb7a", "#3f2c0a"],
    field: ["#1d160a", "#060402"],
    ink: "#ffe9ad",
  },
  platinum: {
    stops: ["#4a4f66", "#d6e4f2", "#fff8fd", "#b9b2e0", "#e9fbff", "#3e4358"],
    field: ["#221d3d", "#06050d"],
    ink: "#f4f1ff",
  },
  locked: {
    stops: ["#232326", "#48484d", "#6b6b72", "#38383c", "#55555b", "#1d1d20"],
    field: ["#151517", "#09090a"],
    ink: "#7a7a80",
  },
};

const C = 60; // centre of the 120×120 drawing

const f = (n: number) => n.toFixed(2);
const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

function octagon(r: number) {
  return (
    Array.from({ length: 8 }, (_, i) => {
      const [x, y] = polar(r, 22.5 + i * 45);
      return `${i ? "L" : "M"}${f(x)} ${f(y)}`;
    }).join("") + "Z"
  );
}

/** Scalloped rosette: lobes bulging outward between valley points. */
function rosette(r: number, lobes = 16) {
  const valley = r * 0.92;
  const step = 360 / lobes;
  let d = "";
  for (let i = 0; i < lobes; i++) {
    const [x0, y0] = polar(valley, i * step);
    const [cx, cy] = polar(r * 1.06, i * step + step / 2);
    const [x1, y1] = polar(valley, (i + 1) * step);
    d += `${i ? "" : `M${f(x0)} ${f(y0)}`}Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}`;
  }
  return d + "Z";
}

function shapePath(shape: MedalShape, r: number) {
  if (shape === "octagon") return octagon(r);
  if (shape === "rosette") return rosette(r);
  return `M${C - r} ${C}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

type Props = {
  achievement: AchievementKey;
  locked?: boolean;
  /** Draw the name around the rim (large sizes only). */
  engraved?: string;
  className?: string;
  title?: string;
};

export function Medal({ achievement, locked, engraved, className, title }: Props) {
  const def = ACHIEVEMENT_BY_KEY[achievement];
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const metal = METALS[locked ? "locked" : def.tier];
  const id = (k: string) => `${k}${uid}`;
  const url = (k: string) => `url(#${id(k)})`;
  const hidden = locked && def.secret;
  const rich = !locked && (def.tier === "gold" || def.tier === "platinum");

  const stops = metal.stops.map((c, i) => (
    <stop key={i} offset={`${(i / (metal.stops.length - 1)) * 100}%`} stopColor={c} />
  ));

  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={id("rim")} x1="0" y1="0" x2="1" y2="1">
          {stops}
        </linearGradient>
        <linearGradient id={id("bevel")} x1="1" y1="1" x2="0" y2="0">
          {stops}
        </linearGradient>
        <linearGradient id={id("ink")} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={metal.ink} />
          <stop offset="45%" stopColor={metal.stops[1]} />
          <stop offset="70%" stopColor={metal.ink} />
          <stop offset="100%" stopColor={metal.stops[3]} />
        </linearGradient>
        <radialGradient id={id("field")} cx="0.42" cy="0.36" r="0.75">
          <stop offset="0%" stopColor={metal.field[0]} />
          <stop offset="100%" stopColor={metal.field[1]} />
        </radialGradient>
        <radialGradient id={id("sheen")} cx="0.3" cy="0.18" r="0.6">
          <stop offset="0%" stopColor="#fff" stopOpacity={locked ? 0.08 : 0.42} />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        {def.tier === "platinum" && !locked && (
          <linearGradient id={id("iris")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd6f0" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#c9f2ff" stopOpacity="0.3" />
            <stop offset="65%" stopColor="#fff3c4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#d4c8ff" stopOpacity="0.55" />
          </linearGradient>
        )}
        <clipPath id={id("clip")}>
          <path d={shapePath(def.shape, 57)} />
        </clipPath>
        <path id={id("rimText")} d={`M${C} ${C}m-46 0a46 46 0 1 1 92 0a46 46 0 1 1 -92 0`} />
      </defs>

      {/* Rim and bevel */}
      <path d={shapePath(def.shape, 57)} fill={url("rim")} />
      {def.shape === "coin" && rich && <Reeding />}
      <path d={shapePath(def.shape, 51)} fill={url("bevel")} />
      <path d={shapePath(def.shape, 49)} fill={url("rim")} opacity="0.55" />

      {/* Enamel field */}
      <path d={shapePath(def.shape === "rosette" ? "coin" : def.shape, 41)} fill={url("field")} />
      <path
        d={shapePath(def.shape === "rosette" ? "coin" : def.shape, 38.5)}
        fill="none"
        stroke={url("ink")}
        strokeWidth="0.6"
        opacity="0.45"
      />
      {def.tier === "platinum" && !locked && (
        <path d={shapePath(def.shape, 57)} fill={url("iris")} opacity="0.7" style={{ mixBlendMode: "overlay" }} />
      )}

      {engraved && def.shape !== "octagon" && (
        <text
          fill={metal.stops[0]}
          fontSize="5.4"
          letterSpacing="1.6"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 600, textTransform: "uppercase" }}
          opacity={locked ? 0.5 : 0.8}
        >
          <textPath href={`#${id("rimText")}`} startOffset="25%" textAnchor="middle">
            {engraved}
          </textPath>
        </text>
      )}

      {/* Emblem */}
      <g
        fill="none"
        stroke={url("ink")}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={locked ? 0.55 : 1}
      >
        {hidden ? (
          <text
            x={C}
            y={C + 11}
            textAnchor="middle"
            fontSize="34"
            fill={url("ink")}
            stroke="none"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
          >
            ?
          </text>
        ) : (
          EMBLEMS[achievement]({ ink: url("ink"), numeral: def.numeral })
        )}
      </g>

      {/* Ornaments: stars struck on the rim of the rarest metals */}
      {rich &&
        (def.tier === "platinum" ? [166, 180, 194] : [180]).map((deg) => {
          const [x, y] = polar(def.shape === "rosette" ? 53 : def.shape === "octagon" ? 49.5 : 54, deg);
          return <Star key={deg} x={x} y={y} r={2.6} fill={metal.ink} />;
        })}

      {/* Light */}
      <path d={shapePath(def.shape, 57)} fill={url("sheen")} clipPath={url("clip")} />
      <path d={shapePath(def.shape, 56.6)} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
    </svg>
  );
}

function Reeding() {
  return (
    <g stroke="#000" strokeOpacity="0.28" strokeWidth="0.7">
      {Array.from({ length: 90 }, (_, i) => {
        const [x0, y0] = polar(53.5, i * 4);
        const [x1, y1] = polar(56.5, i * 4);
        return <line key={i} x1={f(x0)} y1={f(y0)} x2={f(x1)} y2={f(y1)} />;
      })}
    </g>
  );
}

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const d = Array.from({ length: 8 }, (_, i) => {
    const rr = i % 2 ? r * 0.38 : r;
    const a = (i * 45 * Math.PI) / 180;
    return `${i ? "L" : "M"}${f(x + rr * Math.sin(a))} ${f(y - rr * Math.cos(a))}`;
  }).join("");
  return <path d={d + "Z"} fill={fill} stroke="none" />;
}

/* ——— Emblems, drawn inside the field (radius ~30 around the centre) ——— */

type EmblemProps = { ink: string; numeral?: string };

const EMBLEMS: Record<AchievementKey, (p: EmblemProps) => ReactNode> = {
  // Laurel around a strip of film: the whole saga, every frame
  saga: ({ ink }) => (
    <>
      <Laurel ink={ink} />
      <rect x="52.5" y="43" width="15" height="34" rx="1.6" />
      <path d="M52.5 54.3h15M52.5 65.6h15" strokeWidth="1.2" />
      {[46.5, 50, 57.5, 61, 69, 72.5].map((y) => (
        <g key={y} fill={ink} stroke="none">
          <rect x="49.2" y={y - 0.9} width="1.8" height="1.8" rx="0.4" />
          <rect x="69" y={y - 0.9} width="1.8" height="1.8" rx="0.4" />
        </g>
      ))}
    </>
  ),
  // A viewfinder framing a lens: the director's eye
  autor: ({ ink }) => (
    <>
      <path d="M37 47v-8h8M83 47v-8h-8M37 73v8h8M83 73v8h-8" strokeWidth="2.4" />
      <circle cx={C} cy={C} r="12" />
      <circle cx={C} cy={C} r="6.5" strokeWidth="1.3" />
      <circle cx={C} cy={C} r="2.6" fill={ink} stroke="none" />
      <circle cx="56.2" cy="55.8" r="1.2" fill="#fff" stroke="none" opacity="0.8" />
      <path d="M60 41v4M60 75v4M41 60h4M75 60h4" strokeWidth="1.2" />
    </>
  ),
  // Compass rose: a long voyage
  odisseia: ({ ink }) => (
    <>
      <circle cx={C} cy={C} r="16" strokeWidth="1" opacity="0.7" />
      <circle cx={C} cy={C} r="25" strokeWidth="0.6" strokeDasharray="1 2.6" opacity="0.7" />
      {[0, 90, 180, 270].map((deg) => {
        const [tx, ty] = polar(27, deg);
        const [lx, ly] = polar(5, deg - 90);
        const [rx, ry] = polar(5, deg + 90);
        return (
          <g key={deg} stroke="none">
            <path d={`M${f(tx)} ${f(ty)}L${f(lx)} ${f(ly)}L${C} ${C}Z`} fill={ink} />
            <path d={`M${f(tx)} ${f(ty)}L${f(rx)} ${f(ry)}L${C} ${C}Z`} fill={ink} opacity="0.45" />
          </g>
        );
      })}
      {[45, 135, 225, 315].map((deg) => {
        const [tx, ty] = polar(15, deg);
        const [lx, ly] = polar(3.5, deg - 90);
        const [rx, ry] = polar(3.5, deg + 90);
        return <path key={deg} d={`M${f(tx)} ${f(ty)}L${f(lx)} ${f(ly)}L${f(rx)} ${f(ry)}Z`} fill={ink} stroke="none" opacity="0.7" />;
      })}
      <circle cx={C} cy={C} r="2" fill="#000" stroke="none" opacity="0.5" />
    </>
  ),
  // Crescent and stars: the night that went by
  maratona: ({ ink }) => (
    <>
      <path d="M66 38a22 22 0 1 0 14 34a18 18 0 1 1 -14 -34Z" fill={ink} stroke="none" />
      <Star x={74} y={46} r={4.2} fill={ink} />
      <Star x={81} y={58} r={2.4} fill={ink} />
      <Star x={70} y={56} r={1.8} fill={ink} />
    </>
  ),
  // A brilliant-cut gem
  joia: ({ ink }) => (
    <>
      <path d="M48 44h24l9 11L60 80 39 55Z" fill={ink} fillOpacity="0.12" />
      <path d="M39 55h42M48 44l5 11 7-11 7 11 5-11M53 55l7 25 7-25" strokeWidth="1.4" />
      <path d="M53 55l7-11 7 11Z" fill={ink} stroke="none" opacity="0.55" />
      <path d="M39 55l14 0 7 25Z" fill={ink} stroke="none" opacity="0.28" />
      <Star x={77} y={40} r={3.4} fill={ink} />
    </>
  ),
  // A film reel with its tail of film
  cinemateca: ({ ink }) => (
    <>
      <circle cx="58" cy="57" r="20" />
      <circle cx="58" cy="57" r="3.4" fill={ink} stroke="none" />
      {[0, 72, 144, 216, 288].map((deg) => {
        const [x, y] = polar(11.5, deg);
        return <circle key={deg} cx={f(x - 2)} cy={f(y - 3)} r="4.4" strokeWidth="1.5" />;
      })}
      <path d="M58 77h22c3 0 4-1.5 4-4" strokeWidth="2" />
      <path d="M62 77h18" strokeWidth="0.8" strokeDasharray="1.2 1.6" stroke="#000" opacity="0.6" />
    </>
  ),
  // The opening quote of a reflection: an opinion of your own
  "voz-propria": ({ ink }) => (
    <>
      <text
        x={C}
        y={C + 36}
        textAnchor="middle"
        fontSize="86"
        fill={ink}
        stroke="none"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        “
      </text>
      <path d="M46 76h28" strokeWidth="1" opacity="0.7" />
    </>
  ),
  // A ticket stub: admit one
  estreia: ({ ink }) => (
    <g transform="rotate(-14 60 60)">
      <path d="M38 48h44v7a5 5 0 0 0 0 10v7H38v-7a5 5 0 0 0 0-10Z" />
      <path d="M68 49v22" strokeWidth="1" strokeDasharray="1.4 2" />
      <Star x={53} y={60} r={6} fill={ink} />
      <path d="M72.5 55h5M72.5 60h5M72.5 65h5" strokeWidth="1" opacity="0.8" />
    </g>
  ),
  "acervo-10": (p) => <Stack {...p} />,
  "acervo-25": (p) => <Stack {...p} />,
  "acervo-50": (p) => <Stack {...p} />,
  "acervo-100": (p) => <Stack {...p} />,
  // A prism splitting a beam: ten genres, one light
  prisma: () => (
    <>
      <path d="M58 39 77 72H39Z" strokeWidth="2" />
      <path d="M30 63 52 58" strokeWidth="1.6" stroke="#fff" opacity="0.85" />
      {["#e9a59a", "#e9cf8a", "#a9d6a0", "#94bfe6", "#c3a4e6"].map((c, i) => (
        <path key={c} d={`M66 ${57 + i * 1.6}L88 ${50 + i * 5.2}`} stroke={c} strokeWidth="1.5" opacity="0.95" />
      ))}
    </>
  ),
  // A broken seal with the ✕ of NOT CERTIFIED
  implacavel: ({ ink }) => (
    <>
      <path d="M60 38a22 22 0 1 1 -0.1 0Z" fill={ink} fillOpacity="0.14" />
      <circle cx={C} cy={C} r="22" />
      <circle cx={C} cy={C} r="16" strokeWidth="0.8" opacity="0.6" />
      <path d="M53 53l14 14M67 53L53 67" strokeWidth="3" />
      <path d="M62 37.5l-3 7 4 4-3 5" strokeWidth="1.3" stroke="#000" opacity="0.7" />
    </>
  ),
};

/** Two laurel branches rising from the base, leaves in pairs along the stem. */
function Laurel({ ink }: { ink: string }) {
  const leaves = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const deg = 180 + side * (30 + i * 21);
      for (const k of [-1, 1]) {
        const [x, y] = polar(26 + k * 2.4, deg);
        const rot = deg + side * k * 32;
        leaves.push(
          <ellipse
            key={`${side}${i}${k}`}
            cx={f(x)}
            cy={f(y)}
            rx="3.6"
            ry="1.45"
            transform={`rotate(${f(rot)} ${f(x)} ${f(y)})`}
            fill={ink}
            stroke="none"
            opacity={k > 0 ? 1 : 0.75}
          />,
        );
      }
    }
    const [x0, y0] = polar(26, 180 + side * 22);
    const [x1, y1] = polar(26, 180 + side * 140);
    leaves.push(
      <path key={`stem${side}`} d={`M${f(x0)} ${f(y0)}A26 26 0 0 ${side > 0 ? 1 : 0} ${f(x1)} ${f(y1)}`} strokeWidth="0.9" />,
    );
  }
  return <>{leaves}</>;
}

/** Fanned cards, the front one numbered. */
function Stack({ ink, numeral }: EmblemProps) {
  return (
    <>
      <rect x="44" y="38" width="22" height="32" rx="2" transform="rotate(-16 55 54)" strokeWidth="1.4" opacity="0.6" />
      <rect x="54" y="38" width="22" height="32" rx="2" transform="rotate(14 65 54)" strokeWidth="1.4" opacity="0.6" />
      <rect x="49" y="36" width="22" height="32" rx="2" fill="#000" fillOpacity="0.55" />
      <path d="M53 41h6M53 44h3.5" strokeWidth="1" />
      <path d="M53.5 61l3.2 3.2 6.8-7" strokeWidth="1.6" />
      {numeral && (
        <text
          x={C}
          y="83"
          textAnchor="middle"
          fontSize="11"
          letterSpacing="1"
          fill={ink}
          stroke="none"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {numeral}
        </text>
      )}
    </>
  );
}
