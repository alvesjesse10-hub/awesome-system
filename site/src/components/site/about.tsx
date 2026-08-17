import type { SiteContent } from "@/types/content";

export function About({ content }: { content: SiteContent }) {
  const { about } = content;

  return (
    <section id="about" className="bg-white py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold text-navy-950 sm:text-4xl">
            {about.title}
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-navy-600">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <ul className="flex flex-col gap-4 rounded-xl border border-navy-100 bg-navy-50/50 p-6">
            {about.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-sm text-navy-800">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
