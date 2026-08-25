import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

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
    images: ["/logo.png"],
    siteName: BRAND.NAME,
  },
  title: {
    default: BRAND.NAME,
    template: `%s · ${BRAND.NAME}`,
  },
  description: BRAND.TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper">{children}</body>
    </html>
  );
}
