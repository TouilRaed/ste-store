"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/meddm", label: "Accueil", longLabel: "Tableau de bord", glyph: "◈", exact: true },
  { href: "/meddm/orders", label: "Commandes", longLabel: "Commandes", glyph: "▤", exact: false },
  { href: "/meddm/products", label: "Produits", longLabel: "Produits", glyph: "◇", exact: false },
  { href: "/meddm/collections", label: "Catégories", longLabel: "Catégories", glyph: "▧", exact: false },
];

/**
 * A vertical rail on desktop; on phones, the bar fixed to the bottom of the
 * screen where a thumb already is.
 *
 * It used to be a horizontal scroller at the top, which hid two of the four
 * tabs off the right edge with nothing to say they were there, and stacked
 * with the brand and the account links into roughly a third of an iPhone.
 */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[color:var(--line)] bg-white pb-[env(safe-area-inset-bottom)] lg:static lg:flex-col lg:gap-1.5 lg:border-0 lg:bg-transparent lg:pb-0"
      aria-label="Sections"
    >
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors duration-300 lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-4 lg:py-2.5 lg:text-[15px] ${
              active
                ? "text-accent-deep lg:bg-accent lg:text-white"
                : "text-ink-muted lg:text-ink-soft lg:hover:bg-accent-soft lg:hover:text-accent-deep"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {tab.glyph}
            </span>
            <span className="lg:hidden">{tab.label}</span>
            <span className="hidden lg:inline">{tab.longLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
