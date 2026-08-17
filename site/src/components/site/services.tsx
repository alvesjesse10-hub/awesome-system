import type { SiteContent } from "@/types/content";

export function Services({ content }: { content: SiteContent }) {
  const { services } = content;

  return (
    <section id="services" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-navy-950 sm:text-4xl">
            {services.title}
          </h2>
          <p className="mt-4 text-lg text-navy-600">{services.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-navy-100 bg-navy-50/40 p-6 transition hover:border-navy-200 hover:bg-navy-50"
            >
              <h3 className="text-lg font-semibold text-navy-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
