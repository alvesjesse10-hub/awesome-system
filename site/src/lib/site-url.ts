export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  // Vercel injects VERCEL_URL (no protocol) on every deployment, including
  // previews, so preview builds get correct absolute URLs without any
  // manual configuration.
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

// Distinguishes the real production deployment from Vercel preview builds
// (and local dev), so previews can be kept out of search results.
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : process.env.NODE_ENV === "production";
}
