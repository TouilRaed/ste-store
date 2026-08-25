import Link from "next/link";
import type { ReactNode } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin/schemas";

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-accent-soft text-accent-deep",
  paid: "bg-[#e7efe4] text-sage",
  shipped: "bg-[#e6eaf0] text-[#41536b]",
  delivered: "bg-ink text-paper",
  cancelled: "bg-paper-sand text-ink-muted",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status as OrderStatus] ?? "bg-paper-sand text-ink-muted";
  return <span className={`eyebrow rounded-full px-3 py-1 ${tone}`}>{status}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)] ${className}`}>
      <div className="bezel-core rounded-[calc(2rem-0.375rem)] bg-white">{children}</div>
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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-ink-muted">{eyebrow}</p>
        <h1 className="font-display mt-3 text-[clamp(2rem,4vw,3rem)] leading-[0.95] tracking-[-0.02em]">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

/** Setup notice shown when the service-role key is missing. */
export function SetupNotice() {
  return (
    <Panel>
      <div className="p-8">
        <p className="font-display text-2xl">Connectez Supabase d&apos;abord</p>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
          The admin reads and writes with the service-role key. Add{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">.env.local</code>, run{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5">supabase/schema.sql</code>, then restart the
          server.
        </p>
      </div>
    </Panel>
  );
}

export function StatusFilter({ current, basePath }: { current?: string; basePath: string }) {
  const options = [{ value: "", label: "All" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = (current ?? "") === option.value;
        const href = option.value ? `${basePath}?status=${option.value}` : basePath;
        return (
          <Link
            key={option.label}
            href={href}
            className={`rounded-full border px-4 py-1.5 text-[13px] capitalize transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
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
