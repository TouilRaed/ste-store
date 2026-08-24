"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { SpinningLogo } from "@/components/spinning-logo";
import { BagIcon } from "@/components/ui";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/about", label: "À propos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count, hydrated } = useCart();
  const pathname = usePathname();

  // Close the overlay when the route changes. Adjusting state during render is
  // the documented pattern for this — an effect would cause a second paint.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Full-width blue band, edge to edge, like blank.tn. */}
      <header className="sticky top-0 z-30 bg-accent text-white">
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 md:px-8">
          <Link href="/" className="flex items-center gap-3 whitespace-nowrap">
            <SpinningLogo size={32} speed={7} priority className="ring-white/25" />
            <span className="text-[17px] font-medium lowercase">{BRAND.NAME}</span>
          </Link>

          <div className="ml-auto hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[16px] text-white/85 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            href="/cart"
            aria-label={`Cart, ${hydrated ? count : 0} items`}
            className="group ml-auto flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 md:ml-0 text-white transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/25 active:scale-[0.98] md:ml-0"
          >
            <BagIcon className="h-[18px] w-[18px] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-[1px]" />
            <span className="text-[15px] tabular-nums">{hydrated ? count : 0}</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative h-10 w-10 shrink-0 rounded-full bg-white/15 md:hidden"
          >
            <span
              className={`absolute left-1/2 block h-px w-4 -translate-x-1/2 bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                open ? "top-1/2 rotate-45" : "top-[16px] rotate-0"
              }`}
            />
            <span
              className={`absolute left-1/2 block h-px w-4 -translate-x-1/2 bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                open ? "top-1/2 -rotate-45" : "top-[23px] rotate-0"
              }`}
            />
          </button>
        </nav>
      </header>

      {/* Full-bleed glass overlay with staggered mask reveal. */}
      <div
        className={`fixed inset-0 z-20 bg-white/95 backdrop-blur-3xl transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex min-h-[100dvh] flex-col justify-center px-8">
          {NAV.map((item, i) => (
            <div key={item.label} className="overflow-hidden py-1">
              <Link
                href={item.href}
                style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
                className={`font-display block text-[13vw] leading-[1.05] text-accent transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                }`}
              >
                {item.label}
              </Link>
            </div>
          ))}
          <div className="overflow-hidden pt-8">
            <p
              style={{ transitionDelay: open ? "420ms" : "0ms" }}
              className={`eyebrow text-ink-muted transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
              }`}
            >
              Paiement à la livraison
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
