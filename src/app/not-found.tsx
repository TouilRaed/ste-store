import { Eyebrow, PillLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-32 pb-24 text-center md:pt-48">
      <Eyebrow>404</Eyebrow>
      <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
        That piece isn&apos;t here
      </h1>
      <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-soft">
        Runs sell through and pages retire with them. The current cut is a click away.
      </p>
      <div className="mt-10">
        <PillLink href="/shop">See what&apos;s in stock</PillLink>
      </div>
    </div>
  );
}
