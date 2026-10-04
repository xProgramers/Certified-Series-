import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 bg-ink-0/80 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-0/60">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href={user ? `/u/${user.username}` : "/"} aria-label="Certified Series — início" className="shrink-0">
          <Wordmark />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 text-sm sm:gap-3">
          {user ? (
            <>
              <Link href={`/u/${user.username}`} className="px-2 py-2 text-mute transition-colors hover:text-paper">
                Coleção
              </Link>
              <Link
                href="/search"
                aria-label="Buscar e adicionar"
                className="flex items-center gap-2 px-2 py-2 text-mute transition-colors hover:text-paper"
              >
                <SearchIcon />
                <span className="hidden sm:inline">Buscar</span>
              </Link>
              <ThemeToggle />
              <form action={logout}>
                <button className="px-2 py-2 text-dim transition-colors hover:text-paper" type="submit">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/search" aria-label="Buscar" className="px-2 py-2 text-mute transition-colors hover:text-paper">
                <SearchIcon />
              </Link>
              <ThemeToggle />
              <Link href="/login" className="whitespace-nowrap px-2 py-2 text-mute transition-colors hover:text-paper">
                Entrar
              </Link>
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-full bg-paper px-4 py-2 text-ink-0 transition-colors hover:bg-hi"
              >
                Criar coleção
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
