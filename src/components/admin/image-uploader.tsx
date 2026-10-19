"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { prepareImage } from "@/lib/admin/prepare-image";
import { uploadErrorMessage } from "@/lib/admin/upload-error";

type ImageUploaderProps = {
  /** Field name posted with the form — one URL per line, same as before. */
  name: string;
  defaultValue?: string[];
};

/**
 * Uploads straight to /api/admin/uploads (Supabase Storage behind the service
 * role) and keeps the resulting URLs in a hidden field, so the existing server
 * action keeps receiving a newline-separated list.
 */
export function ImageUploader({ name, defaultValue = [] }: ImageUploaderProps) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File) {
    const body = new FormData();
    body.set("file", await prepareImage(file));

    const response = await fetch("/api/admin/uploads", { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as unknown;

    const url =
      payload && typeof payload === "object" && typeof (payload as { url?: unknown }).url === "string"
        ? (payload as { url: string }).url
        : null;

    if (!response.ok || !url) throw new Error(uploadErrorMessage(payload, response.status));
    return url;
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy((n) => n + files.length);

    for (const file of Array.from(files)) {
      try {
        const url = await uploadOne(file);
        setUrls((prev) => [...prev, url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'envoi");
      } finally {
        setBusy((n) => n - 1);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= urls.length) return;
    setUrls((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const remove = (index: number) => setUrls((prev) => prev.filter((_, i) => i !== index));

  return (
    <div>
      <span className="eyebrow text-ink-muted">Photos</span>
      <input type="hidden" name={name} value={urls.join("\n")} />

      {urls.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((url, index) => (
            <li key={`${url}-${index}`}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-paper-deep ring-1 ring-[color:var(--line)]">
                <Image src={url} alt="" fill sizes="160px" className="object-cover" />

                {index === 0 ? (
                  <span className="eyebrow absolute top-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-ink backdrop-blur-sm">
                    Vignette
                  </span>
                ) : null}

                {/* Always on screen. These used to appear on hover, which a
                    phone never reports — the only way to drop a photo was
                    invisible, and a tap in the right spot hit it blind. */}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Retirer la photo ${index + 1}`}
                  className="absolute top-1.5 right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-accent-deep shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  aria-label="Déplacer avant"
                  disabled={index === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line-strong)] text-xs text-ink disabled:opacity-30"
                >
                  ←
                </button>
                <span className="text-xs text-ink-muted tabular-nums">{index + 1}</span>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  aria-label="Déplacer après"
                  disabled={index === urls.length - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line-strong)] text-xs text-ink disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-3 cursor-pointer rounded-2xl border border-dashed px-4 py-8 text-center transition-colors duration-300 ${
          dragging
            ? "border-accent bg-accent-soft"
            : "border-[color:var(--line-strong)] bg-paper/60 hover:bg-white"
        }`}
      >
        <p className="text-sm text-ink-soft">
          {busy > 0
            ? `Envoi de ${busy} photo${busy === 1 ? "" : "s"}…`
            : "Déposez vos photos ici, ou cliquez pour choisir"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">JPEG, PNG, WebP ou AVIF</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(event: ChangeEvent<HTMLInputElement>) => void handleFiles(event.target.files)}
      />

      {error ? <p className="mt-2 text-xs text-accent-deep">{error}</p> : null}
      <p className="mt-2 text-xs text-ink-muted">
        La première photo illustre la vignette. Réordonnez avec ← →, retirez avec ×.
      </p>
    </div>
  );
}
