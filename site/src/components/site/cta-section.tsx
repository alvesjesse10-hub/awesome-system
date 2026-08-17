import type { SiteContent } from "@/types/content";
import { LeadForm } from "./lead-form";

export function CtaSection({ content }: { content: SiteContent }) {
  const { ctaSection } = content;

  return (
    <section id="contact" className="bg-navy-50/60 py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-bold text-navy-950 sm:text-4xl">
            {ctaSection.title}
          </h2>
          <p className="mt-4 text-lg text-navy-600">{ctaSection.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold text-navy-900">
            {ctaSection.formTitle}
          </h3>
          <div className="mt-6">
            <LeadForm content={content} />
          </div>
        </div>
      </div>
    </section>
  );
}
