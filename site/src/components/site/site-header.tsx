import Link from "next/link";
import type { Market, SiteContent } from "@/types/content";

const otherMarket = (market: Market): Market => (market === "br" ? "us" : "br");

export function SiteHeader({ content }: { content: SiteContent }) {
  const { market, nav } = content;

  return (
    <header className="sticky top-0 z-50 border-b border-navy-800/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={`/${market}`} className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-navy-900">
            LedgerBridge
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-navy-700 md:flex">
          <a href={`/${market}#services`} className="transition hover:text-navy-950">
            {nav.services}
          </a>
          <a href={`/${market}#how-it-works`} className="transition hover:text-navy-950">
            {nav.howItWorks}
          </a>
          <a href={`/${market}#about`} className="transition hover:text-navy-950">
            {nav.about}
          </a>
          <Link href={`/${market}/blog`} className="transition hover:text-navy-950">
            {nav.blog}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`/${otherMarket(market)}`}
            className="rounded-md border border-navy-200 px-3 py-1.5 text-sm font-semibold text-navy-700 transition hover:border-navy-400 hover:text-navy-900"
          >
            {nav.switchLabel}
          </Link>
          <a
            href={`/${market}#contact`}
            className="inline-block rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-navy-950 shadow-sm transition hover:bg-amber-400 sm:px-4 sm:py-2"
          >
            {nav.cta}
          </a>
        </div>
      </div>
    </header>
  );
}
