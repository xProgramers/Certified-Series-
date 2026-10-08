import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PosterGrid, PosterTile, Rail, SectionHead, initials, type Owned } from "@/components/Credits";
import { getCurrentUser } from "@/lib/auth";
import { getOwnership } from "@/lib/data";
import { posterUrl } from "@/lib/images";
import { getPerson, type PersonCredit } from "@/lib/tmdb";

type Props = PageProps<"/person/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPerson((await params).id).catch(() => null);
  return { title: p?.name ?? "Pessoa" };
}

const KNOWN_FOR_LIMIT = 10;
const BIO_PREVIEW = 600;

/** An actor's or director's page: who they are and everything they worked on. */
export default async function PersonPage({ params }: Props) {
  const [person, user] = await Promise.all([getPerson((await params).id), getCurrentUser()]);
  if (!person) notFound();
  const owned: Owned = user ? await getOwnership(user.id) : {};

  const all = dedupe([...person.acting, ...person.crew]);
  const seen = all.filter((c) => owned[`${c.type}:${c.id}`]).length;
  const knownFor = all.length > 6 ? [...all].sort((a, b) => b.votes - a.votes).slice(0, KNOWN_FOR_LIMIT) : [];
  const photo = posterUrl(person.profilePath, "w342");
  const crewFirst = person.knownFor !== "Atuação" && person.crew.length > 0;

  const sections = [
    person.acting.length > 0 && (
      <CreditSection key="acting" id="acting" title="Atuação" credits={person.acting} owned={owned} />
    ),
    person.crew.length > 0 && (
      <CreditSection key="crew" id="crew" title="Por trás das câmeras" credits={person.crew} owned={owned} />
    ),
  ];
  if (crewFirst) sections.reverse();

  const lifespan = person.birthday
    ? person.deathday
      ? `${formatDate(person.birthday)} – ${formatDate(person.deathday)}`
      : `Nasceu em ${formatDate(person.birthday)} · ${age(person.birthday)} anos`
    : null;
  const bio = person.biography.trim();

  return (
    <article className="mx-auto max-w-[1200px] px-4 pb-32 pt-12 sm:px-8 sm:pt-16">
      <div className="grid gap-8 md:grid-cols-[minmax(0,240px)_1fr] md:gap-14">
        <div className="w-36 rise sm:w-44 md:w-full">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={`Foto de ${person.name}`} className="aspect-[2/3] w-full rounded-lg object-cover" />
          ) : (
            <div className="grid aspect-[2/3] place-items-center rounded-lg bg-ink-3 font-serif text-6xl text-dim" aria-hidden>
              {initials(person.name)}
            </div>
          )}
        </div>

        <div className="rise" style={{ animationDelay: "100ms" }}>
          {person.knownFor && <p className="eyebrow">{person.knownFor}</p>}
          <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.9] tracking-[-0.025em]">{person.name}</h1>
          {(lifespan || person.placeOfBirth) && (
            <p className="mt-4 text-sm text-mute">{[lifespan, person.placeOfBirth].filter(Boolean).join(" · ")}</p>
          )}

          <dl className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
            <Fact label="Trabalhos" value={all.length} />
            {person.acting.length > 0 && person.crew.length > 0 && (
              <>
                <Fact label="Como ator" value={person.acting.length} />
                <Fact label="Na equipe" value={person.crew.length} />
              </>
            )}
            {user && <Fact label="Na sua coleção" value={seen} gold={seen > 0} />}
          </dl>

          {bio &&
            (bio.length > BIO_PREVIEW ? (
              <details className="group mt-7 max-w-2xl">
                <summary className="cursor-pointer list-none text-[17px] leading-relaxed text-mute [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">
                    {bio.slice(0, BIO_PREVIEW).replace(/\s+\S*$/, "")}…{" "}
                    <span className="text-paper underline underline-offset-4">Ler mais</span>
                  </span>
                </summary>
                <Bio text={bio} />
              </details>
            ) : (
              <div className="mt-7 max-w-2xl">
                <Bio text={bio} />
              </div>
            ))}
        </div>
      </div>

      {knownFor.length > 0 && (
        <section aria-labelledby="known-for" className="mt-20 sm:mt-28">
          <SectionHead id="known-for" eyebrow="Os mais vistos" title="Conhecido por" />
          <Rail>
            {knownFor.map((c) => (
              <PosterTile
                key={`${c.type}:${c.id}`}
                title={c}
                label={c.type === "movie" ? "Filme" : "Série"}
                sub={c.role}
                owned={owned[`${c.type}:${c.id}`]}
              />
            ))}
          </Rail>
        </section>
      )}

      {sections}

      {all.length === 0 && <p className="mt-20 text-mute">Nenhum trabalho encontrado.</p>}
    </article>
  );
}

function CreditSection({ id, title, credits, owned }: { id: string; title: string; credits: PersonCredit[]; owned: Owned }) {
  const series = credits.filter((c) => c.type === "series").length;
  const movies = credits.length - series;
  const eyebrow = [
    movies > 0 && `${movies} ${movies === 1 ? "filme" : "filmes"}`,
    series > 0 && `${series} ${series === 1 ? "série" : "séries"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section aria-labelledby={id} className="mt-20 sm:mt-28">
      <SectionHead id={id} eyebrow={eyebrow} title={title} />
      <PosterGrid>
        {credits.map((c) => (
          <PosterTile
            key={`${c.type}:${c.id}`}
            title={c}
            label={c.type === "movie" ? "Filme" : "Série"}
            sub={[c.role, c.episodes ? `${c.episodes} ep.` : null].filter(Boolean).join(" · ")}
            owned={owned[`${c.type}:${c.id}`]}
            inGrid
          />
        ))}
      </PosterGrid>
    </section>
  );
}

function Fact({ label, value, gold }: { label: string; value: number; gold?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">{label}</dt>
      <dd className={`mt-1.5 font-serif text-2xl leading-none ${gold ? "text-gold" : ""}`}>{value}</dd>
    </div>
  );
}

function Bio({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-[17px] leading-relaxed text-mute">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** Same title as actor and crew counts once. */
function dedupe(list: PersonCredit[]) {
  const map = new Map<string, PersonCredit>();
  for (const c of list) if (!map.has(`${c.type}:${c.id}`)) map.set(`${c.type}:${c.id}`, c);
  return [...map.values()];
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function age(birthday: string) {
  const b = new Date(`${birthday}T12:00:00Z`);
  const now = new Date();
  let years = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) years--;
  return years;
}
