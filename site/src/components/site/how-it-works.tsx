import type { SiteContent } from "@/types/content";

export function HowItWorks({ content }: { content: SiteContent }) {
  const { howItWorks } = content;

  return (
    <section id="how-it-works" className="bg-navy-50/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-navy-950 sm:text-4xl">
            {howItWorks.title}
          </h2>
          <p className="mt-4 text-lg text-navy-600">{howItWorks.subtitle}</p>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="text-4xl font-bold text-navy-200">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-navy-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
