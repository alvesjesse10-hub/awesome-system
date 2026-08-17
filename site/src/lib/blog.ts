import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import type { Market } from "@/types/content";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  slug: string;
  market: Market;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
}

export interface BlogPost extends BlogPostMeta {
  contentHtml: string;
}

function postsDir(market: Market): string {
  return path.join(BLOG_DIR, market);
}

export function getPostSlugs(market: Market): string[] {
  const dir = postsDir(market);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

function readPostFile(market: Market, slug: string) {
  const filePath = path.join(postsDir(market), `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  return matter(raw);
}

export function getAllPosts(market: Market): BlogPostMeta[] {
  const posts = getPostSlugs(market).map((slug) => {
    const { data, content } = readPostFile(market, slug);
    return {
      slug,
      market,
      title: data.title as string,
      description: data.description as string,
      date: data.date as string,
      readingMinutes: Math.max(1, Math.ceil(readingTime(content).minutes)),
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(
  market: Market,
  slug: string
): Promise<BlogPost | null> {
  const filePath = path.join(postsDir(market), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const { data, content } = readPostFile(market, slug);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(content);

  return {
    slug,
    market,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    readingMinutes: Math.max(1, Math.ceil(readingTime(content).minutes)),
    contentHtml: processed.toString(),
  };
}
