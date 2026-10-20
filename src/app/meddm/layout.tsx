import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import Link from "next/link";
import { adminLogout } from "@/app/meddm/actions";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { SpinningLogo } from "@/components/spinning-logo";
import { hasAdminCookie } from "@/lib/admin/auth";
import { BRAND } from "@/lib/brand";

// Order numbers and JSON are set in mono, and only here: loading it in the
// root layout shipped the face to every shopper for nothing.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · ${BRAND.NAME} admin` },
  robots: { index: false, follow: false },
};

// The tab bar sits against the bottom edge of the screen, so the page has to
// reach under the home indicator for `env(safe-area-inset-bottom)` to report
// anything on an iPhone.
export const viewport: Viewport = { viewportFit: "cover" };

export default async function AdminLayout({ children }: LayoutProps<"/meddm">) {
  const authed = await hasAdminCookie();

  // The login page renders bare — the shell only appears once signed in.
  if (!authed)
    return <div className={`${geistMono.variable} flex min-h-[100dvh] flex-col`}>{children}</div>;

  return (
    <div className={`${geistMono.variable} flex min-h-[100dvh] flex-col bg-paper-deep lg:flex-row`}>
      {/* Phone: one slim bar, brand on the left and the account links on the
          right. The sections live in the bottom bar instead. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[color:var(--line)] bg-white px-4 py-2.5 lg:hidden">
        <SpinningLogo size={26} speed={8} />
        <Link href="/meddm" className="truncate text-[15px]">
          {BRAND.NAME}
        </Link>
        <Link
          href="/"
          className="ml-auto rounded-full px-3 py-1.5 text-[13px] text-ink-soft active:bg-accent-soft"
        >
          Boutique
        </Link>
        <form action={adminLogout}>
          <button
            type="submit"
            className="rounded-full border border-[color:var(--line-strong)] px-3 py-1.5 text-[13px] text-ink-soft active:scale-[0.98]"
          >
            Sortir
          </button>
        </form>
      </header>

      {/* Desktop: the full rail. */}
      <aside className="hidden shrink-0 lg:block lg:h-[100dvh] lg:w-64 lg:border-r lg:border-[color:var(--line)] lg:bg-white">
        <div className="flex h-full flex-col gap-5 px-5 py-6">
          <div className="flex items-center gap-3">
            <SpinningLogo size={32} speed={8} />
            <div className="min-w-0">
              <Link href="/meddm" className="block truncate text-[15px]">
                {BRAND.NAME}
              </Link>
              <span className="eyebrow text-accent-deep">Admin</span>
            </div>
          </div>

          <AdminTabs />

          <div className="mt-auto flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-[15px] text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft hover:text-accent-deep"
            >
              Voir la boutique
            </Link>
            <form action={adminLogout} className="w-full">
              <button
                type="submit"
                className="w-full rounded-xl border border-[color:var(--line-strong)] px-4 py-2.5 text-[15px] text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98]"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* The bottom bar on phones; inside the rail above on desktop, where this
          copy renders nothing. */}
      <div className="lg:hidden">
        <AdminTabs />
      </div>

      <main className="w-full flex-1 px-4 pt-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:px-8 lg:overflow-y-auto lg:py-8 lg:pb-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
