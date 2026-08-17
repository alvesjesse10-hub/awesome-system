# LedgerBridge — bilingual commercial site

Lead-generation site (PT-BR / EN-US) for financial BPO / bookkeeping
services, built with Next.js (App Router), TypeScript and Tailwind CSS.

- `/br` — Brazilian market: "Suporte à Gestão Financeira para PMEs"
- `/us` — U.S. market: "Remote Bookkeeping with QuickBooks Online"

Visiting `/` redirects to the right market based on the visitor's
`Accept-Language` header.

## Project structure

```
content/blog/br/       Markdown blog posts (PT-BR)
content/blog/us/        Markdown blog posts (EN-US)
src/app/[market]/       Routes for /br and /us (home, blog, privacy)
src/app/api/lead/       Contact form submission endpoint
src/app/sitemap.ts       Dynamic sitemap.xml
src/app/robots.ts        Dynamic robots.txt
src/components/site/     Page sections (hero, services, header, footer, ...)
src/content/             Per-market copy (br.ts, us.ts) implementing SiteContent
src/lib/                 blog parsing, site URL resolution, structured data
src/types/content.ts     Shared content contract for both markets
```

## Running locally

```bash
npm install
cp .env.example .env.local   # optional — falls back to localhost
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to
`/br` or `/us` depending on your browser's language.

## Editing site copy

All copy lives in `src/content/br.ts` and `src/content/us.ts`, typed
against `src/types/content.ts`. Change text there — no need to touch
components.

## Adding a blog post

Add a new Markdown file under `content/blog/br/` or `content/blog/us/`
with frontmatter:

```md
---
title: "Post title"
description: "One-sentence summary used in listings and SEO."
date: "2026-08-17"
---

Post body in Markdown (GFM supported: tables, strikethrough, etc.)
```

The filename (without `.md`) becomes the URL slug. No code changes or
redeploy trigger needed beyond the normal git push — pages are
statically generated at build time.

## Lead form

Submissions POST to `/api/lead`. If `LEAD_WEBHOOK_URL` is set, each
lead is forwarded there as JSON (works well with a Zapier "Catch Hook"
or a CRM's inbound webhook). Otherwise leads are only logged to the
server console — set the webhook before relying on this in production.

## Environment variables

See `.env.example`. `NEXT_PUBLIC_SITE_URL` controls canonical URLs,
Open Graph tags and the sitemap; on Vercel it falls back automatically
to the deployment's `VERCEL_URL` if unset.

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for the Vercel deployment guide (this
project lives in a subdirectory of its repository, so a couple of
project-settings steps are required).

## Build & lint

```bash
npm run build
npm run lint
```
