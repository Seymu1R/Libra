import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Disclaimer } from "@/components/Disclaimer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tərəzi",
  description: "Bukmeker əmsallarından bazarın konsensus ehtimalları",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <Disclaimer />
          {children}
        </main>
      </body>
    </html>
  );
}
