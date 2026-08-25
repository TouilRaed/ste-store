import type { Metadata } from "next";
import Link from "next/link";
import { adminLogout } from "@/app/admin/actions";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { SpinningLogo } from "@/components/spinning-logo";
import { hasAdminCookie } from "@/lib/admin/auth";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · ${BRAND.NAME} admin` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const authed = await hasAdminCookie();

  // The login page renders bare — the shell only appears once signed in.
  if (!authed) return <div className="flex min-h-[100dvh] flex-col">{children}</div>;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper-deep lg:flex-row">
      {/* Left rail on desktop; a stacked bar on phones. */}
      <aside className="sticky top-0 z-30 shrink-0 border-b border-[color:var(--line)] bg-white lg:h-[100dvh] lg:w-64 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-5 px-4 py-4 lg:px-5 lg:py-6">
          <div className="flex items-center gap-3">
            <SpinningLogo size={32} speed={8} />
            <div className="min-w-0">
              <Link href="/admin" className="block truncate text-[15px]">
                {BRAND.NAME}
              </Link>
              <span className="eyebrow text-accent-deep">Admin</span>
            </div>
          </div>

          <AdminTabs />

          <div className="flex items-center gap-3 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-2">
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-[15px] text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft hover:text-accent-deep"
            >
              View store
            </Link>
            <form action={adminLogout} className="lg:w-full">
              <button
                type="submit"
                className="w-full rounded-xl border border-[color:var(--line-strong)] px-4 py-2.5 text-[15px] text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="w-full flex-1 px-4 py-8 md:px-8 lg:overflow-y-auto">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
