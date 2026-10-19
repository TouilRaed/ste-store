"use client";

import { useActionState } from "react";
import {
  deleteCollectionAction,
  saveCollectionAction,
  type ActionResult,
} from "@/app/meddm/actions";
import { Panel } from "@/components/admin/ui";
import { PillButton } from "@/components/ui";
import type { Collection } from "@/lib/types";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[color:var(--line-strong)] bg-paper/60 px-4 py-2.5 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

/** One collection: editable in place, with its own save state and a delete button. */
function CollectionRow({ collection }: { collection: Collection }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveCollectionAction,
    null,
  );

  return (
    <li className="p-6">
      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_2fr_1fr_auto]">
        <input type="hidden" name="id" value={collection.id} />

        <Field label="Nom">
          <input name="name" defaultValue={collection.name} className={inputClass} />
        </Field>

        <Field label="Sous-titre">
          <input name="tagline" defaultValue={collection.tagline ?? ""} className={inputClass} />
        </Field>

        <Field label="Ordre">
          <input
            name="position"
            type="number"
            min={0}
            defaultValue={collection.position}
            className={inputClass}
          />
        </Field>

        <div className="flex items-end gap-2">
          <PillButton type="submit" disabled={pending} className="text-sm">
            {pending ? "…" : "Enregistrer"}
          </PillButton>
        </div>
      </form>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-ink-muted">/shop?collection={collection.slug}</p>
        {state?.error ? <p className="text-xs text-accent-deep">{state.error}</p> : null}
        <form
          action={deleteCollectionAction}
          onSubmit={(e) => {
            if (!confirm(`Supprimer « ${collection.name} » ? Les produits qui y sont liés restent, mais sans catégorie.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={collection.id} />
          <button
            type="submit"
            className="text-xs text-ink-muted underline decoration-dotted transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-accent-deep"
          >
            Supprimer
          </button>
        </form>
      </div>
    </li>
  );
}

function NewCollectionForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveCollectionAction,
    null,
  );

  return (
    <Panel className="mb-6">
      <form action={formAction} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-[2fr_2fr_1fr_auto]">
        <Field label="Nom">
          <input name="name" placeholder="Ex. Luminaires" required className={inputClass} />
        </Field>

        <Field label="Sous-titre">
          <input name="tagline" placeholder="Optionnel" className={inputClass} />
        </Field>

        <Field label="Ordre">
          <input name="position" type="number" min={0} defaultValue={0} className={inputClass} />
        </Field>

        <div className="flex items-end">
          <PillButton type="submit" disabled={pending} className="text-sm">
            {pending ? "…" : "Ajouter"}
          </PillButton>
        </div>

        {state?.error ? (
          <p className="text-sm text-accent-deep sm:col-span-4">{state.error}</p>
        ) : null}
      </form>
    </Panel>
  );
}

export function CollectionsManager({ collections }: { collections: Collection[] }) {
  return (
    <>
      <NewCollectionForm />

      <Panel>
        {collections.length === 0 ? (
          <p className="p-8 text-sm text-ink-soft">
            Aucune catégorie — les produits sans catégorie restent visibles dans « Tous les produits ».
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--line)]">
            {collections.map((collection) => (
              <CollectionRow key={collection.id} collection={collection} />
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
