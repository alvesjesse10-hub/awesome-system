import type { SiteContent } from "@/types/content";

export function Proof({ content }: { content: SiteContent }) {
  const { proof } = content;

  return (
    <section className="bg-navy-950 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {proof.title}
        </h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {proof.items.map((item) => (
            <div key={item.title}>
              <h3 className="text-base font-semibold text-amber-400">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
