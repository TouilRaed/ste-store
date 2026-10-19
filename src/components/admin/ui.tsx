import Link from "next/link";
import type { ReactNode } from "react";
import { ORDER_STATUSES, type OrderStatus, orderStatusLabel } from "@/lib/admin/schemas";

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-accent-soft text-accent-deep",
  confirmed: "bg-[#e7efe4] text-sage",
  ready: "bg-[#efe9dd] text-[#7a6741]",
  shipped: "bg-[#e6eaf0] text-[#41536b]",
  delivered: "bg-ink text-paper",
  cancelled: "bg-paper-sand text-ink-muted",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status as OrderStatus] ?? "bg-paper-sand text-ink-muted";
  return (
    <span className={`eyebrow rounded-full px-3 py-1 ${tone}`}>{orderStatusLabel(status)}</span>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)] ${className}`}>
      <div className="bezel-core h-full rounded-[calc(2rem-0.375rem)] bg-white">{children}</div>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        <p className="eyebrow text-ink-muted">{eyebrow}</p>
        <h1 className="font-display mt-2 text-[clamp(1.75rem,7vw,3rem)] leading-[0.95] tracking-[-0.02em] md:mt-3">
          {title}
        </h1>
      </div>
      {action ? <div className="w-full md:w-auto">{action}</div> : null}
    </div>
  );
}

/** Setup notice shown when the service-role key is missing. */
export function SetupNotice() {
  return (
    <Panel>
      <div className="p-6 md:p-8">
        <p className="font-display text-2xl">Connectez Supabase d&apos;abord</p>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
          L&apos;admin lit et écrit avec la clé service-role. Ajoutez{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> dans{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">.env.local</code>, exécutez{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">supabase/schema.sql</code>, puis
          redémarrez le serveur.
        </p>
      </div>
    </Panel>
  );
}

export function StatusFilter({ current, basePath }: { current?: string; basePath: string }) {
  const options = [
    { value: "", label: "Toutes" },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusLabel(s) })),
  ];

  // One scrolling line on a phone. Wrapping these seven pills stacked three
  // rows of chrome between the title and the first order.
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const active = (current ?? "") === option.value;
        const href = option.value ? `${basePath}?status=${option.value}` : basePath;
        return (
          <Link
            key={option.label}
            href={href}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
              active
                ? "border-transparent bg-ink text-paper"
                : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
