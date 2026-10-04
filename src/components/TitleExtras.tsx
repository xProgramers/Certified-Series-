import Link from "next/link";
import type { ContentType } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { titleHref } from "@/lib/card-types";
import { getOwnership } from "@/lib/data";
import { posterUrl, profileUrl } from "@/lib/images";
import { getTitleExtras, type Person, type TitleSummary } from "@/lib/tmdb";

type Owned = Awaited<ReturnType<typeof getOwnership>>;

/**
 * Lower half of the title page: cast and director, the rest of the franchise
 * and similar titles. Streamed in after the hero so it never delays it.
 */
export async function TitleExtras({ type, id }: { type: ContentType; id: number }) {
  const [extras, user] = await Promise.all([getTitleExtras(type, id).catch(() => null), getCurrentUser()]);
  if (!extras) return null;
  const owned: Owned = user ? await getOwnership(user.id) : {};
  const { makers, cast, franchise, similar } = extras;
  const isMovie = type === "movie";

  return (
    <>
      {(makers.length > 0 || cast.length > 0) && (
        <section aria-labelledby="credits" className="mt-24 sm:mt-32">
          <SectionHead id="credits" eyebrow="Elenco e equipe" title={isMovie ? "Quem fez o filme" : "Quem fez a série"} />
          {makers.length > 0 && (
            <p className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
                {isMovie ? "Direção" : makers.length > 1 ? "Criadores" : "Criação"}
              </span>
              <span className="font-serif text-2xl leading-tight sm:text-3xl">{listNames(makers.map((m) => m.name))}</span>
            </p>
          )}
          {cast.length > 0 && (
            <ul className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-6 sm:gap-x-6">
              {cast.map((p) => (
                <CastMember key={p.id} person={p} />
              ))}
            </ul>
          )}
        </section>
      )}

      {franchise && (
        <section aria-labelledby="franchise" className="mt-24 sm:mt-32">
          <SectionHead
            id="franchise"
            eyebrow={`A franquia · ${franchise.parts.length} filmes`}
            title={franchise.name}
          />
          <Rail>
            {franchise.parts.map((t, i) => (
              <PosterTile
                key={t.id}
                title={t}
                label={`Parte ${i + 1}`}
                current={t.id === id}
                owned={owned[`${t.type}:${t.id}`]}
              />
            ))}
          </Rail>
        </section>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="similar" className="mt-24 sm:mt-32">
          <SectionHead
            id="similar"
            eyebrow="Se você gostou"
            title={isMovie ? "Filmes parecidos" : "Séries parecidas"}
          />
          <Rail>
            {similar.map((t) => (
              <PosterTile key={t.id} title={t} owned={owned[`${t.type}:${t.id}`]} />
            ))}
          </Rail>
        </section>
      )}
    </>
  );
}

export function TitleExtrasSkeleton() {
  return (
    <div className="mt-24 sm:mt-32" aria-label="Carregando" aria-busy>
      <div className="skeleton h-3 w-32 rounded" />
      <div className="skeleton mt-4 h-9 w-64 rounded" />
      <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-6 sm:gap-x-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-square rounded-full" />
            <div className="skeleton mx-auto mt-3 h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHead({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <header className="border-t border-line pt-6">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-serif text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-[-0.02em]">
        {title}
      </h2>
    </header>
  );
}

function CastMember({ person }: { person: Person }) {
  const src = profileUrl(person.profilePath);
  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <li className="text-center">
      <div className="relative mx-auto aspect-square w-full max-w-[140px] overflow-hidden rounded-full bg-ink-3 ring-1 ring-line">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover grayscale-[35%]" />
        ) : (
          <span className="grid h-full place-items-center font-serif text-3xl text-dim sm:text-4xl" aria-hidden>
            {initials}
          </span>
        )}
      </div>
      <p className="mt-3 font-serif text-lg leading-tight">{person.name}</p>
      {person.role && <p className="mt-1 font-mono text-[10px] uppercase leading-snug tracking-[0.14em] text-dim">{person.role}</p>}
    </li>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ul className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-8 sm:scroll-px-8 sm:gap-6 sm:px-8">
      {children}
    </ul>
  );
}

function PosterTile({
  title: t,
  label,
  current,
  owned,
}: {
  title: TitleSummary;
  label?: string;
  current?: boolean;
  owned?: Owned[string];
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
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
        {current ? <span className="text-gold">Você está aqui</span> : meta}
      </p>
      <h3 className="mt-1 line-clamp-2 font-serif text-lg leading-tight transition-colors group-hover:text-hi">{t.name}</h3>
      {owned && (
        <p className="mt-1 font-mono text-[10px] tracking-wider text-mute">
          <span className="text-gold">✓</span> {owned.status === "completed" ? "Na coleção" : "Assistindo"}
        </p>
      )}
    </>
  );
  return (
    <li className="w-32 shrink-0 snap-start sm:w-40">
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

function listNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}
