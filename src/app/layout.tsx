import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { MetaPixel } from "@/components/meta-pixel";
import { BRAND } from "@/lib/brand";

/**
 * The code from Business Manager > Brand safety > Domains. Rendered as
 * <meta name="facebook-domain-verification">, which is what Meta's crawler
 * looks for. Unset simply leaves the tag out.
 */
const FACEBOOK_DOMAIN_VERIFICATION = process.env.META_DOMAIN_VERIFICATION ?? "";

// Inter carries the body copy; Playfair sets the headings.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// High-contrast serif for display type. `latin-ext` covers the French accents.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  openGraph: {
    // The full lockup, wordmark included — a link preview has room for it.
    images: ["/logo-lockup.png"],
    siteName: BRAND.NAME,
  },
  title: {
    default: BRAND.NAME,
    template: `%s · ${BRAND.NAME}`,
  },
  description: BRAND.TAGLINE,
  ...(FACEBOOK_DOMAIN_VERIFICATION
    ? { verification: { other: { "facebook-domain-verification": FACEBOOK_DOMAIN_VERIFICATION } } }
    : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper">
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
