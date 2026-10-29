import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { Dock, Rail } from "@/components/app-nav";
import { SyncProvider } from "@/components/sync-provider";
import "katex/dist/katex.min.css";
import "./globals.css";

// "Edition": Archivo for headlines, controls and numbers; Source Serif 4 for anything read at length
// (it sits with KaTeX's serif maths); JetBrains Mono for clocks.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "L1 Study", template: "%s · L1 Study" },
  description: "Personal Level I study companion",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#121318" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${sourceSerif.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full font-sans">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-20 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:font-bold focus:text-accent-fg"
        >
          Skip to content
        </a>
        <Rail />
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-5 pt-6 pb-28 sm:px-8 sm:pt-8 sm:pb-10">
            {children}
          </main>
          <footer className="border-t border-line px-5 py-5 text-center text-xs text-muted max-sm:pb-28">
            <Link href="/account" className="mb-2 inline-flex min-h-11 items-center font-bold text-accent hover:underline">
              Account
            </Link>
            <span className="mx-2 text-line" aria-hidden="true">
              ·
            </span>
            <Link href="/backup" className="mb-2 inline-flex min-h-11 items-center font-bold text-accent hover:underline">
              Back up your progress
            </Link>
            <br />
            Personal study tool. Not affiliated with or endorsed by CFA Institute. CFA® is a trademark of CFA Institute.
          </footer>
        </div>
        <Dock />
        <SyncProvider />
      </body>
    </html>
  );
}
