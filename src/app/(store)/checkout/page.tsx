"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { placeOrder, type PlaceOrderResult } from "@/app/actions/orders";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { Eyebrow, PillButton, PillLink } from "@/components/ui";
import { useCart } from "@/lib/cart/cart-context";
import { formatMoney } from "@/lib/format";

const FIELDS = [
  { name: "full_name", label: "Full name", autoComplete: "name", span: 2 },
  { name: "email", label: "Email", autoComplete: "email", type: "email", span: 2 },
  { name: "phone", label: "Phone (optional)", autoComplete: "tel", span: 2 },
  { name: "address_line1", label: "Street address", autoComplete: "address-line1", span: 2 },
  { name: "address_line2", label: "Apartment, floor (optional)", autoComplete: "address-line2", span: 2 },
  { name: "city", label: "City", autoComplete: "address-level2", span: 1 },
  { name: "postal_code", label: "Postal code", autoComplete: "postal-code", span: 1 },
  { name: "country", label: "Country", autoComplete: "country-name", span: 2 },
] as const;

export default function CheckoutPage() {
  const { lines, subtotalCents, shippingCents, totalCents, clear, hydrated } = useCart();
  const [result, setResult] = useState<PlaceOrderResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set(
      "lines",
      JSON.stringify(
        lines.map((l) => ({
          productId: l.productId,
          slug: l.slug,
          size: l.size,
          color: l.color,
          quantity: l.quantity,
        })),
      ),
    );

    startTransition(async () => {
      const res = await placeOrder(formData);
      setResult(res);
      if (res.ok) {
        clear();
        router.push(`/order/${res.orderNumber}`);
      }
    });
  }

  if (hydrated && lines.length === 0 && !pending) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-32 pb-24 text-center md:pt-48">
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
          Your bag is empty
        </h1>
        <div className="mt-10">
          <PillLink href="/shop">Find something</PillLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 md:px-8 md:pt-28">
      <Reveal>
        <Eyebrow>Step 2 of 2</Eyebrow>
        <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
          Where should it go?
        </h1>
      </Reveal>

      <form onSubmit={onSubmit} className="mt-14 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Reveal>
          <div className="bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
            <div className="bezel-core rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8">
              <p className="eyebrow text-ink-muted">Shipping details</p>

              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {FIELDS.map((field) => (
                  <label
                    key={field.name}
                    className={`block ${field.span === 2 ? "sm:col-span-2" : ""}`}
                  >
                    <span className="eyebrow text-ink-muted">{field.label}</span>
                    <input
                      name={field.name}
                      type={"type" in field ? field.type : "text"}
                      autoComplete={field.autoComplete}
                      disabled={pending}
                      className={`mt-2 w-full rounded-2xl border bg-paper/60 px-4 py-3 text-base transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none focus:bg-white ${
                        fieldErrors[field.name]
                          ? "border-accent-deep"
                          : "border-[color:var(--line-strong)] focus:border-accent"
                      }`}
                    />
                    {fieldErrors[field.name] ? (
                      <span className="mt-2 block text-sm text-accent-deep">{fieldErrors[field.name]}</span>
                    ) : null}
                  </label>
                ))}

                <label className="block sm:col-span-2">
                  <span className="eyebrow text-ink-muted">Note for the studio (optional)</span>
                  <textarea
                    name="note"
                    rows={3}
                    disabled={pending}
                    className="mt-2 w-full resize-none rounded-2xl border border-[color:var(--line-strong)] bg-paper/60 px-4 py-3 text-base transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none focus:border-accent focus:bg-white"
                  />
                </label>
              </div>

              {result && !result.ok ? (
                <p className="mt-6 rounded-2xl bg-accent-soft px-4 py-3 text-base text-accent-deep">
                  {result.error}
                </p>
              ) : null}
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="lg:sticky lg:top-28">
          <div className="bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
            <div className="bezel-core rounded-[calc(2rem-0.375rem)] bg-white p-6">
              <p className="eyebrow text-ink-muted">Your bag</p>

              <ul className="mt-6 space-y-4">
                {lines.map((line) => (
                  <li key={line.key} className="flex items-center gap-4">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                      <ProductImage src={line.image} alt="" sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base">{line.name}</p>
                      <p className="text-sm text-ink-muted">
                        {[line.size, line.color].filter(Boolean).join(" · ") || "One size"} × {line.quantity}
                      </p>
                    </div>
                    <p className="text-base tabular-nums">{formatMoney(line.unitCents * line.quantity)}</p>
                  </li>
                ))}
              </ul>

              <dl className="mt-7 space-y-3 border-t border-[color:var(--line)] pt-6 text-base">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd className="tabular-nums">{shippingCents === 0 ? "Free" : formatMoney(shippingCents)}</dd>
                </div>
              </dl>

              <div className="mt-6 flex items-baseline justify-between border-t border-[color:var(--line)] pt-6">
                <span className="font-display text-lg">Total</span>
                <span className="font-display text-2xl tabular-nums">{formatMoney(totalCents)}</span>
              </div>

              <div className="mt-8">
                <PillButton type="submit" disabled={pending} className="w-full">
                  {pending ? "Placing order…" : "Place order"}
                </PillButton>
              </div>

              <p className="mt-5 text-center text-sm text-ink-muted">
                No card is charged here — payment is arranged by email.{" "}
                <Link href="/cart" className="underline underline-offset-4">
                  Edit bag
                </Link>
              </p>
            </div>
          </div>
        </Reveal>
      </form>
    </div>
  );
}
