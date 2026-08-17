import type { MetadataRoute } from "next";
import { markets } from "@/content";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const languages = { "pt-BR": `${siteUrl}/br`, "en-US": `${siteUrl}/us` };
  const privacyLanguages = {
    "pt-BR": `${siteUrl}/br/privacy`,
    "en-US": `${siteUrl}/us/privacy`,
  };

  return markets.flatMap((market) => [
    {
      url: `${siteUrl}/${market}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${siteUrl}/${market}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.2,
      alternates: { languages: privacyLanguages },
    },
  ]);
}
