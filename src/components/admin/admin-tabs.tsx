"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Tableau de bord", glyph: "◈", exact: true },
  { href: "/admin/orders", label: "Commandes", glyph: "▤", exact: false },
  { href: "/admin/products", label: "Produits", glyph: "◇", exact: false },
];

/**
 * Vertical rail on desktop, horizontal scroller on phones where a sidebar
 * would eat half the screen.
 */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1.5 lg:overflow-visible">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] lg:rounded-xl ${
              active ? "bg-accent text-white" : "text-ink-soft hover:bg-accent-soft hover:text-accent-deep"
            }`}
          >
            <span aria-hidden className="text-base">
              {tab.glyph}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
