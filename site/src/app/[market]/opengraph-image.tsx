import { ImageResponse } from "next/og";
import { getContent, isMarket } from "@/content";

export const alt = "LedgerBridge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market: rawMarket } = await params;
  const content = getContent(isMarket(rawMarket) ? rawMarket : "us");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#081222",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(58,104,163,0.55), transparent 55%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>
          LedgerBridge
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              color: "#f59e0b",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 20,
            }}
          >
            {content.hero.eyebrow}
          </div>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.15 }}>
            {content.hero.headline}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
