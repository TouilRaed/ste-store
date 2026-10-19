import { telHref, whatsappHref } from "@/lib/phone";

/**
 * Reaching the customer, which on a cash-on-delivery order is the first thing
 * anyone does with it: the shop rings to confirm before the parcel moves.
 *
 * Plain links, so they hand off to whatever the device uses — the dialler on a
 * phone, WhatsApp Desktop or web on a computer. The WhatsApp message opens
 * written but unsent, so nothing leaves without the shop pressing send.
 */
export function ContactActions({
  phone,
  orderNumber,
  fullName,
}: {
  phone: string | null;
  orderNumber: string;
  fullName: string;
}) {
  const tel = telHref(phone);
  const firstName = fullName.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Bonjour ${firstName}, ` : "Bonjour, ";
  const chat = whatsappHref(
    phone,
    `${greeting}nous vous contactons au sujet de votre commande ${orderNumber} chez Sté DM.`,
  );

  if (!tel && !chat) {
    return <p className="text-sm text-ink-muted">Aucun numéro sur cette commande.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tel ? (
        <a
          href={tel}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] text-paper transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.98] sm:flex-none"
        >
          Appeler
        </a>
      ) : null}

      {chat ? (
        <a
          href={chat}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--line-strong)] bg-white/60 px-5 text-[15px] text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98] sm:flex-none"
        >
          WhatsApp
        </a>
      ) : null}

      {phone ? (
        <span className="w-full text-sm text-ink-muted tabular-nums sm:w-auto sm:ps-2">{phone}</span>
      ) : null}
    </div>
  );
}
