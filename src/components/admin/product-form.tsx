"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteProductAction, saveProductAction, type ActionResult } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { TagPicker } from "@/components/admin/tag-picker";
import { Panel } from "@/components/admin/ui";
import { PillButton } from "@/components/ui";
import type { AdminProduct } from "@/lib/admin/repo";
import type { Collection } from "@/lib/types";

type ProductFormProps = {
  product?: AdminProduct;
  collections: Collection[];
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[color:var(--line-strong)] bg-paper/60 px-4 py-3 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow text-ink-muted">{label}</span>
      {children}
      {error?.length ? (
        <span className="mt-2 block text-xs text-accent-deep">{error[0]}</span>
      ) : hint ? (
        <span className="mt-2 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function ProductForm({ product, collections }: ProductFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveProductAction, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <>
      <form action={formAction}>
        {product ? <input type="hidden" name="id" value={product.id} /> : null}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <Panel>
            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 md:p-8">
              <Field label="Name" error={errors.name} className="sm:col-span-2">
                <input name="name" defaultValue={product?.name} className={inputClass} />
              </Field>

              <Field
                label="Slug"
                hint="Used in the URL: /product/your-slug"
                error={errors.slug}
                className="sm:col-span-2"
              >
                <input name="slug" defaultValue={product?.slug} className={inputClass} />
              </Field>

              <Field label="Description" error={errors.description} className="sm:col-span-2">
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={product?.description}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field
                label="Specification"
                hint="One line per bullet"
                error={errors.details}
                className="sm:col-span-2"
              >
                <textarea
                  name="details"
                  rows={4}
                  defaultValue={product?.details.join("\n")}
                  className={`${inputClass} resize-none font-mono text-[13px]`}
                />
              </Field>

              <div className="sm:col-span-2">
                <ImageUploader name="images" defaultValue={product?.images} />
                {errors.images?.length ? (
                  <span className="mt-2 block text-xs text-accent-deep">{errors.images[0]}</span>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <TagPicker name="tags" defaultValue={product?.tags} />
              </div>

              <Field label="Sizes" hint="One per line" error={errors.sizes}>
                <textarea
                  name="sizes"
                  rows={4}
                  defaultValue={product?.sizes.join("\n")}
                  className={`${inputClass} resize-none font-mono text-[13px]`}
                />
              </Field>

              <Field label="Colours" hint="One per line" error={errors.colors}>
                <textarea
                  name="colors"
                  rows={4}
                  defaultValue={product?.colors.join("\n")}
                  className={`${inputClass} resize-none font-mono text-[13px]`}
                />
              </Field>
            </div>
          </Panel>

          <div className="flex flex-col gap-6">
            <Panel>
              <div className="grid grid-cols-2 gap-5 p-6">
                <Field label="Prix (millimes)" hint="1 DT = 1000 millimes — 220 DT = 220000" error={errors.price_cents}>
                  <input
                    name="price_cents"
                    type="number"
                    min={0}
                    defaultValue={product?.price_cents ?? 0}
                    className={inputClass}
                  />
                </Field>

                <Field label="Prix barré" hint="Optionnel" error={errors.compare_at_cents}>
                  <input
                    name="compare_at_cents"
                    type="number"
                    min={0}
                    defaultValue={product?.compare_at_cents ?? ""}
                    className={inputClass}
                  />
                </Field>

                <Field label="Currency" error={errors.currency}>
                  <input
                    name="currency"
                    maxLength={3}
                    defaultValue={product?.currency ?? "USD"}
                    className={`${inputClass} uppercase`}
                  />
                </Field>

                <Field label="Stock" error={errors.stock}>
                  <input
                    name="stock"
                    type="number"
                    min={0}
                    defaultValue={product?.stock ?? 0}
                    className={inputClass}
                  />
                </Field>

                <Field label="Collection" error={errors.collection_id} className="col-span-2">
                  <select
                    name="collection_id"
                    defaultValue={product?.collection_id ?? ""}
                    className={inputClass}
                  >
                    <option value="">— none —</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Cut for" error={errors.gender} className="col-span-2">
                  <select name="gender" defaultValue={product?.gender ?? "unisex"} className={inputClass}>
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </Field>

                <div className="col-span-2 space-y-3 border-t border-[color:var(--line)] pt-5">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={product?.is_active ?? true}
                      className="h-4 w-4 accent-[color:var(--ink)]"
                    />
                    Visible in the shop
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="is_featured"
                      defaultChecked={product?.is_featured ?? false}
                      className="h-4 w-4 accent-[color:var(--ink)]"
                    />
                    Featured on the home page
                  </label>
                </div>
              </div>
            </Panel>

            {state?.error ? (
              <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.error}</p>
            ) : null}

            <div className="flex items-center gap-3">
              <PillButton type="submit" disabled={pending} className="flex-1">
                {pending ? "Saving…" : product ? "Save changes" : "Create piece"}
              </PillButton>
              <Link
                href="/admin/products"
                className="rounded-full border border-[color:var(--line-strong)] bg-white/60 px-5 py-2.5 text-sm text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98]"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>

      {product ? (
        <form action={deleteProductAction} className="mt-10 border-t border-[color:var(--line)] pt-6">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-sm text-ink-soft">
            Deleting removes the piece from the catalogue. Past orders keep their own copy of the name and
            price.
          </p>
          <button
            type="submit"
            className="mt-4 rounded-full border border-[color:var(--line-strong)] px-5 py-2 text-[13px] text-accent-deep transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft active:scale-[0.98]"
          >
            Delete this piece
          </button>
        </form>
      ) : null}
    </>
  );
}
