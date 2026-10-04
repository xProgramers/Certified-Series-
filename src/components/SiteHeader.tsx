import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { Wordmark } from "./Logo";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink-0/70 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-0/55">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href={user ? `/u/${user.username}` : "/"} aria-label="Certified Series — início" className="shrink-0">
          <Wordmark />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-mute transition-colors hover:text-paper"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Buscar</span>
          </Link>
          {user ? (
            <>
              <Link
                href={`/u/${user.username}`}
                className="rounded-full px-3 py-2 text-mute transition-colors hover:text-paper"
              >
                Coleção
              </Link>
              <form action={logout}>
                <button className="rounded-full px-3 py-2 text-dim transition-colors hover:text-paper" type="submit">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="whitespace-nowrap rounded-full px-3 py-2 text-mute transition-colors hover:text-paper">
                Entrar
              </Link>
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-full border border-line-strong px-4 py-2 text-paper transition-colors hover:border-gold/60 hover:bg-white/[0.03]"
              >
                <span className="sm:hidden">Criar conta</span>
                <span className="hidden sm:inline">Começar coleção</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
