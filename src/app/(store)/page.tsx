import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { SpinningLogo } from "@/components/spinning-logo";
import { PillLink } from "@/components/ui";
import { getCollections, getProducts } from "@/lib/catalog/queries";

export default async function HomePage() {
  const [all, collections] = await Promise.all([getProducts({}), getCollections()]);

  const newArrivals = all.slice(0, 8);

  return (
    <div className="overflow-x-clip">
      {/* ── New arrivals ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-12 md:px-8 md:pt-16">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-2xl font-medium tracking-[-0.01em] uppercase md:text-3xl">Nouveautés</h2>
          <Link href="/shop" className="text-[15px] text-ink-soft underline underline-offset-4">
            Tout voir ({all.length})
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {newArrivals.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 70}>
              <ProductCard product={product} priority={i < 4} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works — the three things a COD shopper asks ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { k: "01", t: "Commandez", d: "Choisissez la taille, laissez votre numéro. Pas de compte, pas de carte." },
            { k: "02", t: "On vous appelle", d: "Un appel pour confirmer l'adresse et la disponibilité." },
            { k: "03", t: "Payez à la livraison", d: "Vous réglez le livreur en main propre, partout en Tunisie." },
          ].map((step) => (
            <div key={step.k} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-6">
              <p className="eyebrow text-accent-deep">{step.k}</p>
              <p className="mt-4 text-lg">{step.t}</p>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Collections ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-4 md:px-8">
        <h2 className="text-2xl font-medium tracking-[-0.01em] uppercase md:text-3xl">Catégories</h2>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/shop?collection=${collection.slug}`}
              className="group rounded-[1.5rem] border border-[color:var(--line)] bg-white p-6 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep"
            >
              <p className="text-lg">{collection.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{collection.tagline}</p>
              <span className="mt-6 inline-block text-[15px] text-accent-deep">Voir →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Contact strip ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
        <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-[color:var(--line)] bg-paper-deep px-6 py-12 text-center">
          <SpinningLogo size={56} speed={8} />
          <p className="max-w-md text-base leading-relaxed text-ink-soft">
            Une question sur une taille ou une commande ? Écrivez-nous — on répond avant de vous
            envoyer quoi que ce soit.
          </p>
          <PillLink href="/shop">Voir les produits</PillLink>
        </div>
      </section>
    </div>
  );
}
