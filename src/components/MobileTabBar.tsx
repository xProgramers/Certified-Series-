"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CollectionIcon, HomeIcon, MedalIcon, SearchIcon } from "./NavIcons";

/**
 * Phone (and small tablet) navigation for signed-in users: the four places the app is about,
 * always one tap away. Hidden from md up, where the header has room for them.
 */
export function MobileTabBar({ username }: { username: string }) {
  const path = usePathname();
  const mine = `/u/${username}`;
  const tabs = [
    { href: "/", label: "Início", Icon: HomeIcon, active: path === "/" },
    { href: "/search", label: "Buscar", Icon: SearchIcon, active: path === "/search" },
    { href: mine, label: "Coleção", Icon: CollectionIcon, active: path === mine },
    { href: `${mine}/conquistas`, label: "Conquistas", Icon: MedalIcon, active: path === `${mine}/conquistas` },
  ];

  return (
    <>
      {/* Keeps the footer clear of the bar */}
      <div aria-hidden className="h-[calc(4rem+var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))] md:hidden" />
      <nav
        aria-label="Navegação do app"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink-0/95 pb-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))] backdrop-blur-xl md:hidden"
      >
        <ul className="grid h-16 grid-cols-4">
          {tabs.map(({ href, label, Icon, active }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  active ? "text-gold" : "text-mute hover:text-paper"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
