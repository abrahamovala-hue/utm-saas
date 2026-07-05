import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";

// Tipografia da identidade:
// Fraunces (serifa de alto contraste) — títulos e números de métricas
// Figtree (sans humanista) — corpo, UI
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "UTM SaaS — Rastreamento de campanhas",
  description:
    "Gerenciamento de UTMs, rastreamento de cliques e análise de campanhas de marketing",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
