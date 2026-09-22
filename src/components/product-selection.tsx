"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductOffer, SelectedOption } from "@/lib/types";

/**
 * What the shopper has picked on a product page.
 *
 * The gallery and the order form sit in two different columns of a server
 * component, so the choice cannot live in either of them. It lives here, and
 * the page wraps both columns in the provider: picking "Type B" swaps the
 * photo on the left and rides along with the order on the right.
 */

type Selection = {
  /** One entry per group, e.g. { Couleur: "Laiton" }. */
  picked: Record<string, string>;
  /** null = the base price; otherwise the index of the chosen offer. */
  offerIndex: number | null;
  /** The photo of the last choice that carries one, or null for the default. */
  spotlight: string | null;
  /** Flat form of `picked`, in the product's own group order. */
  options: SelectedOption[];
  offer: ProductOffer | null;
  unitCents: number;
  choose: (label: string, value: string) => void;
  chooseOffer: (index: number | null) => void;
};

const SelectionContext = createContext<Selection | null>(null);

export function ProductSelectionProvider({
  product,
  children,
}: {
  product: Product;
  children: ReactNode;
}) {
  const groups = useMemo(() => product.option_groups ?? [], [product.option_groups]);

  // Every group starts on its first choice, so a shopper who ignores the
  // pickers still orders something well-defined rather than nothing.
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      groups.filter((g) => g.choices.length > 0).map((g) => [g.label, g.choices[0].name]),
    ),
  );
  const [offerIndex, setOfferIndex] = useState<number | null>(null);
  const [spotlight, setSpotlight] = useState<string | null>(() => {
    for (const group of groups) {
      const first = group.choices[0];
      if (first?.image) return first.image;
    }
    return null;
  });

  const value = useMemo<Selection>(() => {
    const offers = product.offers ?? [];
    const offer = offerIndex === null ? null : (offers[offerIndex] ?? null);

    return {
      picked,
      offerIndex,
      spotlight,
      options: groups
        .filter((g) => picked[g.label])
        .map((g) => ({ label: g.label, value: picked[g.label] })),
      offer,
      unitCents: offer ? offer.price_cents : product.price_cents,
      choose: (label, valueName) => {
        setPicked((current) => ({ ...current, [label]: valueName }));
        const choice = groups
          .find((g) => g.label === label)
          ?.choices.find((c) => c.name === valueName);
        // A choice without a photo leaves the gallery where it is, rather than
        // blanking it — half a catalogue may have photos and half not.
        if (choice?.image) setSpotlight(choice.image);
      },
      chooseOffer: setOfferIndex,
    };
  }, [groups, picked, offerIndex, spotlight, product.offers, product.price_cents]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useProductSelection(): Selection {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("useProductSelection must be used inside <ProductSelectionProvider>");
  return context;
}
