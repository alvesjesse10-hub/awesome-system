import type { MetadataRoute } from "next";
import { markets } from "@/content";
import { getAllPosts } from "@/lib/blog";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const languages = { "pt-BR": `${siteUrl}/br`, "en-US": `${siteUrl}/us` };
  const privacyLanguages = {
    "pt-BR": `${siteUrl}/br/privacy`,
    "en-US": `${siteUrl}/us/privacy`,
  };
  const blogLanguages = {
    "pt-BR": `${siteUrl}/br/blog`,
    "en-US": `${siteUrl}/us/blog`,
  };

  const staticEntries: MetadataRoute.Sitemap = markets.flatMap((market) => [
    {
      url: `${siteUrl}/${market}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${siteUrl}/${market}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: { languages: blogLanguages },
    },
    {
      url: `${siteUrl}/${market}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
      alternates: { languages: privacyLanguages },
    },
  ]);

  const postEntries: MetadataRoute.Sitemap = markets.flatMap((market) =>
    getAllPosts(market).map((post) => ({
      url: `${siteUrl}/${market}/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: "yearly",
      priority: 0.5,
    }))
  );

  return [...staticEntries, ...postEntries];
}
