import Link from "next/link";
import type { EntryStatus } from "@/db/schema";
import { personHref, titleHref } from "@/lib/card-types";
import { posterUrl, profileUrl } from "@/lib/images";
import type { Person, TitleSummary } from "@/lib/tmdb";
import { TitleStreaming } from "./TitleStreaming";

/**
 * Building blocks shared by the title page's lower half, the full cast page
 * and the person page: people link to their profile, titles to their page.
 */

export type Owned = Record<string, { status: EntryStatus; n: number }>;

export function SectionHead({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <header className="border-t border-line pt-6">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-serif text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-[-0.02em]">
        {title}
      </h2>
    </header>
  );
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export function PeopleGrid({ children }: { children: React.ReactNode }) {
  return <ul className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-6 sm:gap-x-6">{children}</ul>;
}

/** Round photo, name and character; the whole tile opens the person's page. */
export function PersonTile({ person }: { person: Person }) {
  const src = profileUrl(person.profilePath);
  const sub = [person.role, person.episodes ? `${person.episodes} ep.` : null].filter(Boolean).join(" · ");
  return (
    <li className="text-center">
      <Link href={personHref(person.id)} className="group block rounded-lg">
        <div className="relative mx-auto aspect-square w-full max-w-[140px] overflow-hidden rounded-full bg-ink-3 ring-1 ring-line transition-shadow duration-300 group-hover:ring-gold/60">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover grayscale-[35%] transition-[filter,transform] duration-700 ease-[var(--ease-cinema)] group-hover:scale-[1.04] group-hover:grayscale-0"
            />
          ) : (
            <span className="grid h-full place-items-center font-serif text-3xl text-dim sm:text-4xl" aria-hidden>
              {initials(person.name)}
            </span>
          )}
        </div>
        <p className="mt-3 font-serif text-lg leading-tight transition-colors group-hover:text-hi">{person.name}</p>
        {sub && <p className="mt-1 font-mono text-[10px] uppercase leading-snug tracking-[0.14em] text-dim">{sub}</p>}
      </Link>
    </li>
  );
}

/** "A, B e C", each name linking to its person page. */
export function PeopleNames({ people }: { people: Person[] }) {
  return people.map((p, i) => (
    <span key={p.id}>
      {i > 0 && (i === people.length - 1 ? " e " : ", ")}
      <Link href={personHref(p.id)} className="underline-offset-[6px] transition-colors hover:text-hi hover:underline">
        {p.name}
      </Link>
    </span>
  ));
}

export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ul className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-8 sm:scroll-px-8 sm:gap-6 sm:px-8">
      {children}
    </ul>
  );
}

export function PosterGrid({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-10 grid grid-cols-3 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-6 md:grid-cols-5 lg:grid-cols-6">
      {children}
    </ul>
  );
}

export function PosterTile({
  title: t,
  label,
  sub,
  current,
  owned,
  inGrid,
}: {
  title: TitleSummary;
  /** Shown before the year, above the name. */
  label?: string;
  /** Shown under the name (a character, a job). */
  sub?: string | null;
  current?: boolean;
  owned?: Owned[string];
  /** Fills a PosterGrid cell instead of a fixed-width Rail slot. */
  inGrid?: boolean;
}) {
  const src = posterUrl(t.posterPath, "w342");
  const meta = [label, t.year].filter(Boolean).join(" · ");
  const body = (
    <>
      <div
        className={`relative aspect-[2/3] overflow-hidden rounded-md bg-ink-3 ${
          current ? "ring-1 ring-gold ring-offset-4 ring-offset-ink-0" : ""
        }`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-cinema)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center p-4 text-center font-serif text-lg text-dim">{t.name}</div>
        )}
        {!current && <TitleStreaming type={t.type} id={t.id} className="absolute bottom-1.5 right-1.5" />}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
        {current ? <span className="text-gold">Você está aqui</span> : meta}
      </p>
      <h3 className="mt-1 line-clamp-2 font-serif text-lg leading-tight transition-colors group-hover:text-hi">{t.name}</h3>
      {sub && <p className="mt-1 line-clamp-2 text-xs leading-snug text-mute">{sub}</p>}
      {owned && (
        <p className="mt-1 font-mono text-[10px] tracking-wider text-mute">
          <span className="text-gold">✓</span> {owned.status === "completed" ? "Na coleção" : "Assistindo"}
        </p>
      )}
    </>
  );
  return (
    <li className={inGrid ? "min-w-0" : "w-32 shrink-0 snap-start sm:w-40"}>
      {current ? (
        <div aria-current="page">{body}</div>
      ) : (
        <Link href={titleHref(t.type, t.id)} className="group block">
          {body}
        </Link>
      )}
    </li>
  );
}
