const ITEMS = [
  "PAIEMENT À LA LIVRAISON",
  "LIVRAISON DANS LES 24 GOUVERNORATS",
  "SÉRIES LIMITÉES",
  "LIVRAISON 8 DT PARTOUT EN TUNISIE",
];

/**
 * Announcement bar. Sits above the nav on every page and scrolls away with
 * the document — the nav itself stays sticky.
 */
export function Ticker() {
  return (
    <div className="relative z-[2] border-b border-[color:var(--line)] bg-white py-2.5 text-accent-deep">
      <div className="flex overflow-hidden">
        <div className="animate-drift flex shrink-0 items-center gap-8 pr-8">
          {[...ITEMS, ...ITEMS, ...ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex items-center gap-8 text-[12px] font-medium tracking-[0.16em] whitespace-nowrap"
            >
              {item}
              <span className="h-1 w-1 rounded-full bg-accent/50" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
