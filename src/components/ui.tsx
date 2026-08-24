import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Hairline 1px-stroke icons only — no thick utility-icon sets. */
export function ArrowIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth={1} stroke="currentColor" className={className} aria-hidden>
      <path d="M4.5 11.5 11.5 4.5M11.5 4.5H5.75M11.5 4.5v5.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" strokeWidth={1} stroke="currentColor" className={className} aria-hidden>
      <path d="M4.5 6.5h11l-.9 9.2a1.4 1.4 0 0 1-1.4 1.3H6.8a1.4 1.4 0 0 1-1.4-1.3L4.5 6.5Z" strokeLinejoin="round" />
      <path d="M7.4 8V5.9a2.6 2.6 0 0 1 5.2 0V8" strokeLinecap="round" />
    </svg>
  );
}

export function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} stroke="currentColor" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`eyebrow inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/60 px-3 py-1 text-ink-muted ${className}`}
    >
      {children}
    </span>
  );
}

type PillLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  tone?: "ink" | "paper" | "ghost";
};

/**
 * Island CTA: fully rounded pill with the trailing arrow nested in its own
 * circle, flush with the inner padding. Presses down on click.
 */
export function PillLink({ children, tone = "ink", className = "", ...rest }: PillLinkProps) {
  const tones = {
    ink: "bg-accent text-white hover:bg-accent-deep",
    paper: "bg-white text-ink border border-[color:var(--line)] hover:bg-paper-deep",
    ghost: "bg-transparent text-accent border border-accent/30 hover:bg-accent-soft",
  } as const;

  const circle = tone === "ink" ? "bg-white/20" : "bg-accent/10";

  return (
    <Link
      {...rest}
      className={`group inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-6 text-base transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${tones[tone]} ${className}`}
    >
      <span className="translate-y-[0.5px]">{children}</span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 ${circle}`}
      >
        <ArrowIcon />
      </span>
    </Link>
  );
}

type PillButtonProps = ComponentProps<"button"> & { children: ReactNode; tone?: "ink" | "paper" };

export function PillButton({ children, tone = "ink", className = "", ...rest }: PillButtonProps) {
  const tones = {
    ink: "bg-accent text-white hover:bg-accent-deep disabled:bg-ink-muted",
    paper: "bg-white text-ink border border-[color:var(--line)] hover:bg-paper-deep",
  } as const;
  const circle = tone === "ink" ? "bg-white/20" : "bg-accent/10";

  return (
    <button
      {...rest}
      className={`group inline-flex items-center justify-between gap-3 rounded-full py-2 pr-2 pl-6 text-base transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${tones[tone]} ${className}`}
    >
      <span className="translate-y-[0.5px]">{children}</span>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 ${circle}`}
      >
        <ArrowIcon />
      </span>
    </button>
  );
}

/** Outer shell + inner core, concentric radii. Everything premium sits in one. */
export function Bezel({
  children,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={`bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)] ${className}`}>
      <div className={`bezel-core rounded-[calc(2rem-0.375rem)] bg-white ${innerClassName}`}>{children}</div>
    </div>
  );
}
