"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductOptionGroup } from "@/lib/types";

type ChoiceRow = { name: string; image: string | null };
type GroupRow = { label: string; choices: ChoiceRow[] };

const rowInputClass =
  "w-full rounded-xl border border-[color:var(--line-strong)] bg-paper/60 px-3 py-2 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

/**
 * The ways a product varies — "Couleur", "Type" — each choice carrying its own
 * photo, which the storefront shows the moment a shopper clicks it.
 *
 * Serialises to one `option_groups` JSON string in a hidden field, the same
 * shape OffersEditor uses, so the surrounding uncontrolled form still posts in
 * one piece and the server keeps a single parse boundary.
 */
export function OptionGroupsEditor({
  defaultGroups = [],
}: {
  defaultGroups?: ProductOptionGroup[];
}) {
  const [groups, setGroups] = useState<GroupRow[]>(() =>
    defaultGroups.map((g) => ({
      label: g.label,
      choices: (g.choices ?? []).map((c) => ({ name: c.name, image: c.image ?? null })),
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const target = useRef<{ group: number; choice: number } | null>(null);

  // A group with no label, or a choice with no name, is a half-typed draft —
  // it never reaches the server.
  const payload = groups
    .map((g) => ({
      label: g.label.trim(),
      choices: g.choices
        .map((c) => ({ name: c.name.trim(), image: c.image }))
        .filter((c) => c.name.length > 0),
    }))
    .filter((g) => g.label.length > 0 && g.choices.length > 0);

  function updateGroup(index: number, patch: Partial<GroupRow>) {
    setGroups((current) => current.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function updateChoice(gi: number, ci: number, patch: Partial<ChoiceRow>) {
    setGroups((current) =>
      current.map((g, i) =>
        i === gi
          ? { ...g, choices: g.choices.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }
          : g,
      ),
    );
  }

  async function onPick(files: FileList | null) {
    const where = target.current;
    if (!files?.length || !where) return;
    setError(null);
    setUploading(`${where.group}:${where.choice}`);

    try {
      const body = new FormData();
      body.set("file", files[0]);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error ?? `Échec de l'envoi (${response.status})`);
      updateChoice(where.group, where.choice, { image: data.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name="option_groups" value={JSON.stringify(payload)} />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void onPick(e.target.files)}
      />

      {groups.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-muted">
          Aucune option. Le produit se vend tel quel.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {groups.map((group, gi) => (
            <li key={gi} className="rounded-2xl border border-[color:var(--line)] p-4">
              <div className="flex items-end gap-3">
                <label className="block flex-1">
                  <span className="eyebrow text-ink-muted">Nom du groupe</span>
                  <input
                    type="text"
                    value={group.label}
                    onChange={(e) => updateGroup(gi, { label: e.target.value })}
                    placeholder="Couleur"
                    className={`mt-2 ${rowInputClass}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setGroups((c) => c.filter((_, i) => i !== gi))}
                  className="pb-2 text-sm text-ink-muted underline underline-offset-4 hover:text-accent-deep"
                >
                  Retirer
                </button>
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {group.choices.map((choice, ci) => (
                  <li key={ci} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        target.current = { group: gi, choice: ci };
                        fileInput.current?.click();
                      }}
                      title="Photo de cette option"
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-dashed border-[color:var(--line-strong)] bg-paper/60 text-xs text-ink-muted"
                    >
                      {choice.image ? (
                        <Image src={choice.image} alt="" fill sizes="48px" className="object-cover" />
                      ) : uploading === `${gi}:${ci}` ? (
                        "…"
                      ) : (
                        "+"
                      )}
                    </button>

                    <input
                      type="text"
                      value={choice.name}
                      onChange={(e) => updateChoice(gi, ci, { name: e.target.value })}
                      placeholder="Laiton"
                      className={rowInputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        updateGroup(gi, { choices: group.choices.filter((_, j) => j !== ci) })
                      }
                      className="text-sm text-ink-muted underline underline-offset-4 hover:text-accent-deep"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => updateGroup(gi, { choices: [...group.choices, { name: "", image: null }] })}
                className="mt-3 text-sm text-accent underline underline-offset-4"
              >
                + Ajouter une option
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="mt-3 text-sm text-accent-deep">{error}</p> : null}

      <button
        type="button"
        onClick={() => setGroups((c) => [...c, { label: "", choices: [{ name: "", image: null }] }])}
        className="mt-4 rounded-full border border-[color:var(--line-strong)] px-4 py-2 text-sm text-ink-soft hover:bg-paper-deep"
      >
        + Ajouter un groupe
      </button>
    </div>
  );
}
