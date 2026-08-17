export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return configured?.replace(/\/$/, "") || "http://localhost:3000";
}
