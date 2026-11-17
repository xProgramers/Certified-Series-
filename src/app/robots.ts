import type { MetadataRoute } from "next";

/**
 * Crawlers following title → cast → person → title links could walk all of
 * TMDB through our server-rendered pages and burn the Vercel plan limits.
 * Profiles and shared cards stay open so link previews and search still work.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/u/", "/card/", "/privacidade", "/termos", "/excluir-conta"],
      disallow: ["/api/", "/series/", "/movies/", "/person/", "/search", "/login", "/signup", "/configuracoes", "/notificacoes"],
    },
  };
}
