import Link from "next/link";
import { AdPrivacyLink } from "@/components/ads/AdPrivacyLink";
import { getCurrentUser } from "@/lib/auth";

const link = "transition-colors hover:text-paper";

export async function SiteFooter() {
  const user = await getCurrentUser();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 text-xs text-dim sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <nav aria-label="Institucional" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacidade" className={link}>
            Privacidade
          </Link>
          <Link href="/termos" className={link}>
            Termos
          </Link>
          {user && (
            <Link href="/excluir-conta" className={link}>
              Excluir conta
            </Link>
          )}
          <AdPrivacyLink className={link} />
        </nav>
        {/* Attribution required by the TMDB API terms of use */}
        <p className="max-w-md leading-relaxed sm:text-right">
          Dados e imagens de{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className={`font-medium text-mute ${link}`}>
            TMDB
          </a>
          . Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
        </p>
      </div>
    </footer>
  );
}
