import type { SiteContent } from "@/types/content";

export function Hero({ content }: { content: SiteContent }) {
  const { hero } = content;

  return (
    <section className="relative overflow-hidden bg-navy-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(58,104,163,0.35),_transparent_55%)]"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-400">
            {hero.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            {hero.headline}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-navy-100">
            {hero.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              {hero.primaryCta}
            </a>
            <a
              href="#services"
              className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              {hero.secondaryCta}
            </a>
          </div>

          <ul className="mt-10 flex flex-col gap-3 text-sm text-navy-200 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
            {hero.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
