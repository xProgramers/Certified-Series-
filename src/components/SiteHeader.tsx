import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { HomeIcon, SearchIcon } from "./NavIcons";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const navLink = "px-2 py-2 text-mute transition-colors hover:text-paper";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    // The Android app draws under the status bar; Capacitor sets --safe-area-inset-top there
    <header className="sticky top-0 z-40 bg-ink-0/80 pt-[var(--safe-area-inset-top,env(safe-area-inset-top,0px))] backdrop-blur-xl supports-[backdrop-filter]:bg-ink-0/60">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" aria-label="Certified Series — início" className="shrink-0">
          <Wordmark />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 text-sm sm:gap-3">
          {user ? (
            <>
              {/* On phones these live in the bottom tab bar (MobileTabBar) */}
              <Link href="/" className={`hidden items-center gap-2 sm:flex ${navLink}`}>
                <HomeIcon className="h-4 w-4" />
                Início
              </Link>
              <Link href={`/u/${user.username}`} className={`hidden sm:inline ${navLink}`}>
                Coleção
              </Link>
              <Link href={`/u/${user.username}/conquistas`} className={`hidden sm:inline ${navLink}`}>
                Conquistas
              </Link>
              <Link href="/search" className={`hidden items-center gap-2 sm:flex ${navLink}`}>
                <SearchIcon />
                Buscar
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
              <Link href="/search" aria-label="Buscar" className={navLink}>
                <SearchIcon className="h-5 w-5 sm:h-4 sm:w-4" />
              </Link>
              <ThemeToggle />
              <Link href="/login" className={`whitespace-nowrap ${navLink}`}>
                Entrar
              </Link>
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-full bg-paper px-4 py-2 text-ink-0 transition-colors hover:bg-hi"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
