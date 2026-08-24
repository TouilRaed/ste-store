import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

// blank.tn sets its whole page in Inter; so do we.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
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
  description:
    "Small-run clothing made from traceable cloth. Tailored pieces, everyday essentials, outerwear and knitwear, shipped worldwide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper">{children}</body>
    </html>
  );
}
