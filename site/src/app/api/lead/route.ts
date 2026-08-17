import { NextResponse, type NextRequest } from "next/server";

interface LeadPayload {
  market?: string;
  name?: string;
  email?: string;
  company?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: LeadPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { market, name, email, company, message } = body;

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const lead = {
    market: market ?? "unknown",
    name,
    email,
    company: company ?? "",
    message,
    receivedAt: new Date().toISOString(),
  };

  // Forward to a CRM/Zapier webhook when configured; otherwise just log
  // the lead so it's visible in server logs during early phases.
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
    } catch (error) {
      console.error("Failed to forward lead to webhook", error);
    }
  } else {
    console.log("New lead received:", lead);
  }

  return NextResponse.json({ ok: true });
}
