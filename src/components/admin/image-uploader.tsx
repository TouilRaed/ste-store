"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

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
    body.set("file", file);

    const response = await fetch("/api/admin/uploads", { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;

    if (!response.ok || !payload?.url) {
      throw new Error(payload?.error ?? `Upload failed (${response.status})`);
    }
    return payload.url;
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

  return (
    <div>
      <span className="eyebrow text-ink-muted">Photos</span>
      <input type="hidden" name={name} value={urls.join("\n")} />

      {urls.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {urls.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-paper-deep ring-1 ring-[color:var(--line)]"
            >
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />

              {index === 0 ? (
                <span className="eyebrow absolute top-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-ink backdrop-blur-sm">
                  Cover
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  aria-label="Move earlier"
                  disabled={index === 0}
                  className="rounded-full bg-white/85 px-2 py-0.5 text-xs text-ink disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
                  aria-label="Remove photo"
                  className="rounded-full bg-white/85 px-2 py-0.5 text-xs text-accent-deep"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  aria-label="Move later"
                  disabled={index === urls.length - 1}
                  className="rounded-full bg-white/85 px-2 py-0.5 text-xs text-ink disabled:opacity-40"
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
          dragging ? "border-accent bg-accent-soft" : "border-[color:var(--line-strong)] bg-paper/60 hover:bg-white"
        }`}
      >
        <p className="text-sm text-ink-soft">
          {busy > 0 ? `Uploading ${busy} image${busy === 1 ? "" : "s"}…` : "Drop photos here, or click to choose"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">JPEG, PNG, WebP or AVIF · up to 5 MB each</p>
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
      <p className="mt-2 text-xs text-ink-muted">First photo is the card image. Drag order with ← →.</p>
    </div>
  );
}
