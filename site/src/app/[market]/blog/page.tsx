import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, isMarket } from "@/content";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/site/blog-card";

export async function generateMetadata({
  params,
}: PageProps<"/[market]/blog">): Promise<Metadata> {
  const { market } = await params;
  if (!isMarket(market)) return {};

  const content = getContent(market);
  return {
    title: `${content.blog.title} | LedgerBridge`,
    description: content.blog.subtitle,
    alternates: { canonical: `/${market}/blog` },
  };
}

export default async function BlogIndexPage({ params }: PageProps<"/[market]/blog">) {
  const { market } = await params;
  if (!isMarket(market)) notFound();

  const content = getContent(market);
  const posts = getAllPosts(market);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-navy-950 sm:text-4xl">
          {content.blog.title}
        </h1>
        <p className="mt-4 text-lg text-navy-600">{content.blog.subtitle}</p>
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 text-navy-500">{content.blog.empty}</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} content={content} />
          ))}
        </div>
      )}
    </section>
  );
}
