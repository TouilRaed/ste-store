import type { Metadata } from "next";
import { SpinningLogo } from "@/components/spinning-logo";
import { BRAND, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/brand";
import { InstagramIcon, PillLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "À propos",
  description: `Qui nous sommes et comment commander chez ${BRAND.NAME}.`,
};

/**
 * Every claim here is either how the shop demonstrably works (cash on
 * delivery, 24 gouvernorats, live stock) or comes from the brand's own
 * Instagram bio. Nothing about the studio is invented.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 pb-8 md:px-8 md:pt-16">
      <div className="flex items-center gap-4">
        <SpinningLogo size={56} speed={8} priority />
        <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] leading-[0.95] font-semibold tracking-[-0.03em] uppercase">
          À propos
        </h1>
      </div>

      <p className="mt-8 text-lg leading-relaxed text-ink-soft">
        {BRAND.NAME} est une petite marque tunisienne. Nous produisons en séries courtes : quand
        une pièce est épuisée, elle ne revient pas forcément.
      </p>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-[-0.01em] uppercase">Commander</h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Tout se paie <strong className="text-ink">à la livraison</strong>. Vous choisissez votre
          taille, vous laissez un numéro de téléphone, nous vous appelons pour confirmer l&apos;adresse,
          puis vous réglez le livreur en main propre. Pas de carte bancaire, pas de compte à créer.
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Nous livrons dans les 24 gouvernorats. La livraison est de 8 DT, réglée avec la commande à
          la réception.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-[-0.01em] uppercase">Les pièces</h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Chaque fiche produit indique la matière, la coupe et l&apos;entretien. Le stock affiché est
          réel : quand il reste moins de huit pièces, la boutique vous le dit.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-[-0.01em] uppercase">Neuf, avec étiquette</h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Toutes les pièces sont <strong className="text-ink">neuves et avec leur étiquette</strong>.
          Rien de porté, rien de retouché.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-[-0.01em] uppercase">Nous écrire</h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Le plus simple est Instagram — nouveautés, disponibilités et réponses aux questions de
          taille.
        </p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 text-base text-white transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-deep active:scale-[0.98]"
        >
          <InstagramIcon className="h-5 w-5" />
          {INSTAGRAM_HANDLE}
        </a>
      </section>

      <div className="mt-14 flex flex-wrap gap-3">
        <PillLink href="/shop">Voir la boutique</PillLink>
        <PillLink href="/lookbook" tone="ghost">
          Lookbook
        </PillLink>
      </div>
    </div>
  );
}
