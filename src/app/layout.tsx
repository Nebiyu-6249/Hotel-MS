import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { IMAGES } from "@/lib/images";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hotel Transylvania | Castle Hotel in the Carpathian Mountains",
    template: "%s | Hotel Transylvania",
  },
  description:
    "A restored 1867 castle hotel in the hills above Brasov, Romania. Twenty-six rooms behind meter-thick stone walls, a wood-fired restaurant and marked trails from the gate. Book direct for the best rate.",
  openGraph: {
    type: "website",
    siteName: "Hotel Transylvania",
    images: [{ url: IMAGES.hero, width: 2400, height: 1600 }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#191512",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
