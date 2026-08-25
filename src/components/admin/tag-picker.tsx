"use client";

import { useState, type KeyboardEvent } from "react";

/** One-click tags. Anything else can be typed. */
const PRESETS = [
  "Nouveau",
  "Nouveauté",
  "Promotion",
  "Édition limitée",
  "Exclusif",
  "Dernières pièces",
  "Bientôt de retour",
];

type TagPickerProps = {
  name: string;
  defaultValue?: string[];
};

export function TagPicker({ name, defaultValue = [] }: TagPickerProps) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  const add = (value: string) => {
    const tag = value.trim();
    if (!tag || tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
  };

  const remove = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault(); // don't submit the product form
    add(draft);
    setDraft("");
  }

  return (
    <div>
      <span className="eyebrow text-ink-muted">Étiquettes</span>
      <input type="hidden" name={name} value={tags.join("\n")} />

      {tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => remove(tag)}
                className="group flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-[13px] text-paper transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                {tag}
                <span className="text-paper/60 group-hover:text-paper">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.filter((preset) => !tags.includes(preset)).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => add(preset)}
            className="rounded-full border border-[color:var(--line-strong)] bg-white/60 px-3 py-1.5 text-[13px] text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white"
          >
            + {preset}
          </button>
        ))}
      </div>

      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          add(draft);
          setDraft("");
        }}
        placeholder="Autre étiquette — Entrée pour ajouter"
        className="mt-3 w-full rounded-2xl border border-[color:var(--line-strong)] bg-paper/60 px-4 py-3 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white"
      />

      <p className="mt-2 text-xs text-ink-muted">
        Shown on the card. &ldquo;Épuisé&rdquo; and &ldquo;Plus que N&rdquo; are automatic from stock,
        and &ldquo;Promo&rdquo; from the compare-at price — no need to tag those.
      </p>
    </div>
  );
}
