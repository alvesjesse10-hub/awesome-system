import { notFound } from "next/navigation";
import { getContent, isMarket } from "@/content";
import { buildProfessionalServiceSchema } from "@/lib/structured-data";
import { Hero } from "@/components/site/hero";
import { Services } from "@/components/site/services";
import { HowItWorks } from "@/components/site/how-it-works";
import { About } from "@/components/site/about";
import { Proof } from "@/components/site/proof";
import { CtaSection } from "@/components/site/cta-section";

export default async function MarketHomePage({ params }: PageProps<"/[market]">) {
  const { market } = await params;
  if (!isMarket(market)) notFound();

  const content = getContent(market);
  const schema = buildProfessionalServiceSchema(content);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Hero content={content} />
      <Services content={content} />
      <HowItWorks content={content} />
      <About content={content} />
      <Proof content={content} />
      <CtaSection content={content} />
    </>
  );
}
