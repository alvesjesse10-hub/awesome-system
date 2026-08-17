# Deploying to Vercel

This site lives at `site/` inside a repository that also contains an
unrelated project (`backend/`, `frontend/` — a separate financial
control system). The one setting that matters most below is **Root
Directory: `site`** — without it, Vercel will try to build the wrong
project.

## 1. Import the project

1. In the [Vercel dashboard](https://vercel.com/new), choose **Add
   New → Project** and import the `alvesjesse10-hub/awesome-system`
   GitHub repository.
2. Before clicking Deploy, expand **Root Directory** and set it to
   `site`. Vercel will then auto-detect the Next.js framework preset
   and pick up `site/package.json`'s `build`/`start` scripts — no
   custom build command is needed.
3. Leave Build/Output settings on their defaults.

## 2. Environment variables

In **Project Settings → Environment Variables**, add:

| Name | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-production-domain.com` | Production only |
| `LEAD_WEBHOOK_URL` | Your Zapier/CRM inbound webhook URL | Production (and Preview, if you want leads submitted from preview links forwarded too) |

Leave `NEXT_PUBLIC_SITE_URL` **unset** for Preview/Development — the
site automatically falls back to Vercel's own `VERCEL_URL` for those,
so preview links still get correct canonical/OG URLs without manual
configuration.

Without `LEAD_WEBHOOK_URL`, submitted leads are only written to the
Vercel function logs (Project → Logs) — set the webhook before
treating this as the live contact channel.

## 3. Node.js version

`package.json` pins `"engines": { "node": ">=20.9.0" }`. Vercel reads
this automatically; you generally don't need to touch **Project
Settings → General → Node.js Version**, but if it's ever pinned to an
older major version there, bump it to 20.x or newer.

## 4. Deploy

Click **Deploy**. First deploy gives you a `*.vercel.app` preview URL
— use it to run through the checklist below before pointing a real
domain at it.

## 5. Add your domain

1. **Project Settings → Domains** → add your domain and follow the
   DNS instructions Vercel shows (A record or CNAME, depending on
   whether it's an apex domain or subdomain).
2. Once the domain is verified, update `NEXT_PUBLIC_SITE_URL` to match
   it exactly (with `https://`, no trailing slash) and redeploy
   (Project → Deployments → ⋯ → Redeploy) so canonical URLs, the
   sitemap, and Open Graph images all resolve to the real domain.

## 6. How branch deploys behave

- Every push to any branch gets its own **Preview** deployment.
- The repository's default branch (`main`) is Vercel's **Production**
  branch by default — merging into it triggers a production deploy.
- `robots.txt` automatically returns `Disallow: /` on anything that
  isn't the production deployment (`VERCEL_ENV !== "production"`), so
  preview URLs won't get indexed by search engines.

## 7. Post-deploy checklist

- [ ] `/br` and `/us` load and redirect correctly from `/`
- [ ] `/sitemap.xml` lists both markets, blog posts, and privacy pages
      with the right domain
- [ ] `/robots.txt` shows `Allow: /` on production, `Disallow: /` on
      any preview URL
- [ ] Submit the contact form once on each market and confirm the
      lead shows up (webhook target, or Vercel function logs if no
      webhook is configured yet)
- [ ] Share a page link through a social debugger (e.g. Facebook's
      Sharing Debugger or LinkedIn's Post Inspector) to confirm the
      Open Graph image and title/description render correctly
