import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog";
import type { SiteContent } from "@/types/content";
import { formatDate } from "@/lib/format-date";

export function BlogCard({
  post,
  content,
}: {
  post: BlogPostMeta;
  content: SiteContent;
}) {
  return (
    <Link
      href={`/${content.market}/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-navy-100 bg-white p-6 transition hover:border-navy-200 hover:shadow-sm"
    >
      <p className="text-xs font-medium text-navy-400">
        {formatDate(post.date, content.locale)} · {post.readingMinutes}{" "}
        {content.blog.minutesRead}
      </p>
      <h2 className="mt-3 text-lg font-semibold text-navy-900 transition group-hover:text-navy-950">
        {post.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">
        {post.description}
      </p>
    </Link>
  );
}
