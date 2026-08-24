"use client";

import { useActionState } from "react";
import { adminLogin, type ActionResult } from "@/app/admin/actions";
import { PillButton } from "@/components/ui";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(adminLogin, null);

  return (
    <form action={formAction} className="mt-8">
      <label className="block">
        <span className="eyebrow text-ink-muted">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          disabled={pending}
          className="mt-2 w-full rounded-2xl border border-[color:var(--line-strong)] bg-paper/60 px-4 py-3 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white"
        />
      </label>

      {state?.error ? (
        <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.error}</p>
      ) : null}

      <PillButton type="submit" disabled={pending} className="mt-6 w-full">
        {pending ? "Checking…" : "Sign in"}
      </PillButton>
    </form>
  );
}
