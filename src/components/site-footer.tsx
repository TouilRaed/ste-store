import Link from "next/link";
import { SpinningLogo } from "@/components/spinning-logo";
import { Eyebrow, InstagramIcon } from "@/components/ui";
import { BRAND, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Produits",
    links: [
      { href: "/shop", label: "Tous les produits" },
      { href: "/shop?collection=decoration-murale", label: "Décoration murale" },
      { href: "/shop?collection=luminaires", label: "Luminaires" },
      { href: "/shop?collection=textile-tapis", label: "Textile & tapis" },
      { href: "/shop?sort=price-asc", label: "Les moins chers" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-[2] mt-32 border-t border-[color:var(--line)] bg-paper-deep px-4 pt-20 pb-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <SpinningLogo size={40} speed={9} />
              <p className="text-xl tracking-[0.02em]">{BRAND.NAME}</p>
            </div>
            <p className="mt-4 max-w-xs text-base leading-relaxed text-ink-soft">
              {BRAND.TAGLINE}
            </p>
            <Eyebrow className="mt-6">{BRAND.COUNTRY_LINE}</Eyebrow>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-ink-muted">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-base text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact — Instagram lives here rather than in the nav band. */}
          <div>
            <p className="eyebrow text-ink-muted">Contact</p>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-accent px-5 py-2.5 text-base text-white transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-deep active:scale-[0.98]"
            >
              <InstagramIcon className="h-[18px] w-[18px]" />
              {INSTAGRAM_HANDLE}
            </a>

            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Écrivez-nous en message privé pour les tailles, les disponibilités ou le suivi d&apos;une
              commande.
            </p>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-base text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-base text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
                >
                  Mon panier
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-[color:var(--line)] pt-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.NAME} — tous droits réservés.</p>
          <p className="tracking-[0.14em] uppercase">صنع في تونس</p>
        </div>
      </div>
    </footer>
  );
}
