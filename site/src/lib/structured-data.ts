import type { SiteContent } from "@/types/content";
import type { BlogPostMeta } from "./blog";
import { getSiteUrl } from "./site-url";

export function buildArticleSchema(content: SiteContent, post: BlogPostMeta) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: content.locale,
    url: `${siteUrl}/${content.market}/blog/${post.slug}`,
    author: { "@type": "Person", name: "LedgerBridge" },
    publisher: { "@type": "Organization", name: "LedgerBridge" },
  };
}

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
