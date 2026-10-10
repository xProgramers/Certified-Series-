import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { posterUrl } from "@/lib/images";
import { listNotifications, markAllRead } from "@/lib/notifications";

export const metadata: Metadata = { title: "Notificações" };

function when(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notificacoes");
  const items = await listNotifications(user.id);
  // Seen now: the dots stay on this visit, the bell is clear from the next page on
  if (items.some((n) => !n.readAt)) after(() => markAllRead(user.id));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-8 sm:pt-16">
      <h1 className="font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">Notificações</h1>
      <p className="mt-4 text-sm text-mute">Episódios novos e estreias de temporada das séries da sua coleção.</p>

      {items.length === 0 ? (
        <p className="mt-16 font-serif text-2xl italic text-mute">
          Nada por aqui ainda. Quando sair um episódio de uma série da sua coleção, ele aparece aqui.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {items.map((n) => {
            const src = posterUrl(n.posterPath, "w185");
            return (
              <li key={n.id}>
                <Link href={n.url} className="flex items-center gap-4 py-4 transition-colors hover:bg-paper/[0.03]">
                  <span className="h-[72px] w-12 shrink-0 overflow-hidden rounded-md bg-ink-3">
                    {src && (
                      // eslint-disable-next-line @next/next/no-img-element -- same-origin proxy, sized by CSS
                      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full bg-gold" aria-label="Nova" />}
                      <span className="truncate font-serif text-xl leading-tight">{n.title}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-mute">{n.body}</span>
                    <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                      {n.kind === "season" ? "Nova temporada" : "Novo episódio"} · {when(n.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
