import type { ContentType } from "@/db/schema";
import { getWatchProviders } from "@/lib/tmdb";
import { ProviderMark } from "./ProviderIcons";

/** "Onde assistir" on the title page: streaming in Brazil, then rent or buy. Streamed in after the hero. */
export async function WhereToWatch({ type, id }: { type: ContentType; id: number }) {
  const providers = await getWatchProviders(type, id).catch(() => null);
  if (!providers || (!providers.stream.length && !providers.store.length)) return null;
  const rows: [string, typeof providers.stream][] = [
    ["Streaming", providers.stream],
    ["Alugar ou comprar", providers.store],
  ];

  return (
    <div className="mt-7 fade-in">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">Onde assistir</p>
      <dl className="mt-3 space-y-2.5">
        {rows
          .filter(([, list]) => list.length)
          .map(([label, list]) => (
            <div key={label} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <dt className="sr-only">{label}</dt>
              {list.map((p) => (
                <dd key={p.key} className="flex items-center gap-2 text-sm text-mute">
                  <ProviderMark provider={p} tone="plain" />
                  {p.name}
                </dd>
              ))}
              {label !== "Streaming" && <dd className="font-mono text-[10px] tracking-wider text-dim">aluguel ou compra</dd>}
            </div>
          ))}
      </dl>
      {providers.link && (
        <p className="mt-3 text-[11px] text-dim">
          <a href={providers.link} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-mute hover:underline">
            Dados de JustWatch via TMDB
          </a>
        </p>
      )}
    </div>
  );
}
