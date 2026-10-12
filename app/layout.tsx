import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "katex/dist/katex.min.css";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

const NAV = [
  { href: "/", label: "Today" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/review", label: "Review" },
  { href: "/mock", label: "Mock exam" },
  { href: "/resources", label: "Free resources" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-20 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-bold focus:text-accent-fg">
          Skip to content
        </a>
        <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
          <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[15px]">
            <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-accent text-[13px] font-extrabold text-accent-fg">
                L1
              </span>
              <span className="text-[17px]">L1 Study</span>
            </Link>
            <div className="flex flex-wrap gap-1 font-semibold">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-muted hover:bg-accent-soft hover:text-accent">
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
          Personal study tool. Not affiliated with or endorsed by CFA Institute. CFA® is a trademark of CFA Institute.
        </footer>
      </body>
    </html>
  );
}
