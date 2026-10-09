import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { CompletionRevealHost } from "@/components/CompletionReveal";
import { MobileTabBar } from "@/components/MobileTabBar";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { THEME_BG, themeScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Certified Series — seu repertório, em cartaz", template: "%s · Certified Series" },
  description: "Cada série que você termina vira um card na sua coleção pessoal.",
  applicationName: "Certified Series",
  appleWebApp: { capable: true, title: "Certified", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: THEME_BG.dark,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    // data-theme is set by the inline script before paint, hence suppressHydrationWarning
    <html
      lang="pt-BR"
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain min-h-full flex flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink-0"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {user && <MobileTabBar username={user.username} />}
        <CompletionRevealHost />
      </body>
    </html>
  );
}
