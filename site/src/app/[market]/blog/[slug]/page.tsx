import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent, isMarket } from "@/content";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";
import { formatDate } from "@/lib/format-date";
import { buildArticleSchema } from "@/lib/structured-data";

export async function generateStaticParams({
  params,
}: {
  params: { market: string };
}) {
  const { market } = params;
  if (!isMarket(market)) return [];
  return getPostSlugs(market).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[market]/blog/[slug]">): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isMarket(market)) return {};

  const post = await getPostBySlug(market, slug);
  if (!post) return {};

  return {
    title: `${post.title} | LedgerBridge`,
    description: post.description,
    alternates: { canonical: `/${market}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({
  params,
}: PageProps<"/[market]/blog/[slug]">) {
  const { market, slug } = await params;
  if (!isMarket(market)) notFound();

  const post = await getPostBySlug(market, slug);
  if (!post) notFound();

  const content = getContent(market);
  const schema = buildArticleSchema(content, post);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Link
        href={`/${market}/blog`}
        className="text-sm font-medium text-navy-500 transition hover:text-navy-900"
      >
        ← {content.blog.backToList}
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-navy-950 sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-2 text-sm text-navy-400">
        {formatDate(post.date, content.locale)} · {post.readingMinutes}{" "}
        {content.blog.minutesRead}
      </p>

      <div
        className="prose prose-slate mt-10 max-w-none prose-headings:text-navy-950 prose-a:text-navy-700 prose-a:underline prose-a:underline-offset-4 prose-strong:text-navy-900 prose-blockquote:border-amber-400 prose-blockquote:text-navy-700"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
