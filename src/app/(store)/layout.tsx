import { CartProvider } from "@/lib/cart/cart-context";
import { SiteHeader } from "@/components/site-header";
import { Ticker } from "@/components/ticker";
import { SiteFooter } from "@/components/site-footer";
import { CartToast } from "@/components/cart-toast";

/** Storefront chrome. The admin route group renders its own shell instead. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <div className="grain flex min-h-full flex-1 flex-col">
        <Ticker />
        <SiteHeader />
        <main className="relative z-[2] flex-1">{children}</main>
        <SiteFooter />
        <CartToast />
      </div>
    </CartProvider>
  );
}
