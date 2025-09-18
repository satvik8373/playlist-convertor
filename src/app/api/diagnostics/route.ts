import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("host");
  const protocol = url.protocol;
  const expected = process.env.NEXTAUTH_URL || "";
  const vercelUrl = process.env.VERCEL_URL || "";
  const computed = protocol + "//" + (host ?? "");

  return NextResponse.json({
    ok: true,
    host,
    protocol,
    computedBaseUrl: computed,
    NEXTAUTH_URL: expected,
    VERCEL_URL: vercelUrl,
    hasSecrets: {
      NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
      SPOTIFY_CLIENT_ID: Boolean(process.env.SPOTIFY_CLIENT_ID),
      SPOTIFY_CLIENT_SECRET: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
    },
    tips: [
      "Ensure NEXTAUTH_URL matches computedBaseUrl exactly (scheme + host)",
      "Set NEXTAUTH_SECRET in Vercel (Production & Preview)",
      "Set SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET",
    ],
  });
}


