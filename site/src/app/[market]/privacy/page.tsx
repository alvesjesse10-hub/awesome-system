import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, isMarket } from "@/content";

export async function generateMetadata({
  params,
}: PageProps<"/[market]/privacy">): Promise<Metadata> {
  const { market } = await params;
  if (!isMarket(market)) return {};

  const content = getContent(market);
  return {
    title: `${content.privacy.title} | ${content.meta.title}`,
    description: content.privacy.intro,
    robots: { index: false, follow: true },
  };
}

export default async function PrivacyPage({ params }: PageProps<"/[market]/privacy">) {
  const { market } = await params;
  if (!isMarket(market)) notFound();

  const content = getContent(market);
  const { privacy } = content;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-navy-950 sm:text-4xl">
        {privacy.title}
      </h1>
      <p className="mt-2 text-sm text-navy-400">{privacy.lastUpdated}</p>
      <p className="mt-6 text-base leading-relaxed text-navy-600">
        {privacy.intro}
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {privacy.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-semibold text-navy-900">
              {section.heading}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-navy-600">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
