import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getContent, isMarket, markets } from "@/content";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return markets.map((market) => ({ market }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[market]">): Promise<Metadata> {
  const { market } = await params;
  if (!isMarket(market)) return {};

  const content = getContent(market);
  return {
    title: content.meta.title,
    description: content.meta.description,
    alternates: {
      languages: {
        "pt-BR": "/br",
        "en-US": "/us",
      },
    },
  };
}

export default async function MarketLayout({
  children,
  params,
}: LayoutProps<"/[market]">) {
  const { market } = await params;
  if (!isMarket(market)) notFound();

  const content = getContent(market);

  return (
    <html lang={content.htmlLang} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader content={content} />
        <main className="flex-1">{children}</main>
        <SiteFooter content={content} />
      </body>
    </html>
  );
}
