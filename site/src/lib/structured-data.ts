import type { SiteContent } from "@/types/content";
import { getSiteUrl } from "./site-url";

export function buildProfessionalServiceSchema(content: SiteContent) {
  const siteUrl = getSiteUrl();
  const areaServed = content.market === "br" ? "BR" : "US";

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "LedgerBridge",
    description: content.meta.description,
    url: `${siteUrl}/${content.market}`,
    areaServed,
    inLanguage: content.locale,
    knowsAbout: content.services.items.map((item) => item.title),
  };
}
