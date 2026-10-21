import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { Disclaimer } from "@/components/Disclaimer";
import { THEME_SCRIPT } from "@/components/theme-script";
import "./globals.css";

const firaSans = Fira_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-sans",
});
const firaCode = Fira_Code({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  title: "Tərəzi",
  description: "Bukmeker əmsallarından bazarın konsensus ehtimalları",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets class/style on <html> before hydration.
    <html lang="az" className={`${firaSans.variable} ${firaCode.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
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
