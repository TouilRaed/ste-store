"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteProductAction, saveProductAction, type ActionResult } from "@/app/meddm/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { OffersEditor } from "@/components/admin/offers-editor";
import { OptionGroupsEditor } from "@/components/admin/option-groups-editor";
import { TagPicker } from "@/components/admin/tag-picker";
import { Panel } from "@/components/admin/ui";
import { PillButton } from "@/components/ui";
import type { AdminProduct } from "@/lib/admin/repo";
import { minorToMajorInput } from "@/lib/format";
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
  // "Disponible" replaces a raw stock number: the toggle sets a large or zero
  // quantity behind the scenes, so the existing "en stock" / "épuisé" logic
  // elsewhere in the app needs no change.
  const [disponible, setDisponible] = useState(product ? product.stock > 0 : true);

  return (
    <>
      <form action={formAction}>
        {product ? <input type="hidden" name="id" value={product.id} /> : null}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <Panel>
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 md:p-8">
              <Field label="Nom" error={errors.name} className="sm:col-span-2">
                <input name="name" defaultValue={product?.name} className={inputClass} />
              </Field>

              {product ? (
                <p className="-mt-3 text-xs text-ink-muted sm:col-span-2">
                  URL : /product/{product.slug}
                </p>
              ) : null}
              {errors.slug?.length ? (
                <p className="-mt-3 text-xs text-accent-deep sm:col-span-2">{errors.slug[0]}</p>
              ) : null}

              <Field label="Description" error={errors.description} className="sm:col-span-2">
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={product?.description}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field
                label="Caractéristiques"
                hint="Une ligne par point"
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

              <div className="sm:col-span-2">
                <span className="eyebrow text-ink-muted">Offres</span>
                <p className="mt-1 mb-3 text-xs leading-relaxed text-ink-muted">
                  Lots optionnels proposés en plus du prix de base — ex. « 3 pièces » à 120 DT.
                </p>
                <OffersEditor
                  defaultOffers={product?.offers}
                  currency={product?.currency ?? "TND"}
                />
                {errors.offers?.length ? (
                  <span className="mt-2 block text-xs text-accent-deep">{errors.offers[0]}</span>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <span className="eyebrow text-ink-muted">Options</span>
                <p className="mt-1 mb-3 text-xs leading-relaxed text-ink-muted">
                  Les déclinaisons du produit — « Couleur », « Type », « Modèle ». Donnez une photo à
                  chaque option : elle s&apos;affiche dans la galerie quand le client la sélectionne, et
                  le choix est enregistré avec la commande.
                </p>
                <OptionGroupsEditor defaultGroups={product?.option_groups} />
                {errors.option_groups?.length ? (
                  <span className="mt-2 block text-xs text-accent-deep">{errors.option_groups[0]}</span>
                ) : null}
              </div>
            </div>
          </Panel>

          <div className="flex flex-col gap-6">
            <Panel>
              <div className="grid grid-cols-2 gap-5 p-5 md:p-6">
                <Field label="Prix (DT)" hint="En dinars — ex : 220 ou 89,500" error={errors.price_cents}>
                  <input
                    name="price_dinars"
                    type="text"
                    inputMode="decimal"
                    defaultValue={minorToMajorInput(product?.price_cents, product?.currency ?? "TND")}
                    className={inputClass}
                  />
                </Field>

                <Field label="Prix barré (DT)" hint="Optionnel" error={errors.compare_at_cents}>
                  <input
                    name="compare_at_dinars"
                    type="text"
                    inputMode="decimal"
                    defaultValue={minorToMajorInput(product?.compare_at_cents, product?.currency ?? "TND")}
                    className={inputClass}
                  />
                </Field>

                {/* The shop only ever sells in dinars — no field to fill in. */}
                <input type="hidden" name="currency" value="TND" />

                <div className="col-span-2">
                  <span className="eyebrow text-ink-muted">Disponibilité</span>
                  <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={disponible}
                      onChange={(e) => setDisponible(e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[color:var(--ink)]"
                    />
                    Disponible
                  </label>
                  {/* Behind the scenes this is still the stock column: a large
                      number when available, zero when not — the storefront's
                      "en stock" / "épuisé" logic already reads it that way. */}
                  <input type="hidden" name="stock" value={disponible ? 999 : 0} />
                  {errors.stock?.length ? (
                    <span className="mt-2 block text-xs text-accent-deep">{errors.stock[0]}</span>
                  ) : null}
                </div>

                <Field label="Collection" error={errors.collection_id} className="col-span-2">
                  <select
                    name="collection_id"
                    defaultValue={product?.collection_id ?? ""}
                    className={inputClass}
                  >
                    <option value="">— aucune —</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Coupe pour" error={errors.gender} className="col-span-2">
                  <select name="gender" defaultValue={product?.gender ?? "unisex"} className={inputClass}>
                    <option value="women">Femme</option>
                    <option value="men">Homme</option>
                    <option value="unisex">Unisexe</option>
                  </select>
                </Field>

                <div className="col-span-2 space-y-3 border-t border-[color:var(--line)] pt-5">
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={product?.is_active ?? true}
                      className="h-5 w-5 shrink-0 accent-[color:var(--ink)]"
                    />
                    Visible dans la boutique
                  </label>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="is_featured"
                      defaultChecked={product?.is_featured ?? false}
                      className="h-5 w-5 shrink-0 accent-[color:var(--ink)]"
                    />
                    Mis en avant sur l&apos;accueil
                  </label>
                </div>
              </div>
            </Panel>

            {state?.error ? (
              <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.error}</p>
            ) : null}

            {/* Pinned above the tab bar on a phone: the form runs several
                screens long, and the way to save it sat at the very bottom. */}
            <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex items-center gap-3 border-t border-[color:var(--line)] bg-paper-deep/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
              <PillButton type="submit" disabled={pending} className="flex-1">
                {pending ? "Enregistrement…" : product ? "Enregistrer" : "Créer la pièce"}
              </PillButton>
              <Link
                href="/meddm/products"
                className="rounded-full border border-[color:var(--line-strong)] bg-white/60 px-5 py-3 text-sm text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98]"
              >
                Annuler
              </Link>
            </div>
          </div>
        </div>
      </form>

      {product ? (
        <form action={deleteProductAction} className="mt-10 border-t border-[color:var(--line)] pt-6">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-sm text-ink-soft">
            La suppression retire la pièce du catalogue. Les commandes passées gardent leur propre copie
            du nom et du prix.
          </p>
          <button
            type="submit"
            className="mt-4 rounded-full border border-[color:var(--line-strong)] px-5 py-2.5 text-[13px] text-accent-deep transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft active:scale-[0.98]"
          >
            Supprimer cette pièce
          </button>
        </form>
      ) : null}
    </>
  );
}
