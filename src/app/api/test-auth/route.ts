import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  return NextResponse.json({
    message: "Auth test endpoint",
    baseUrl,
    spotifySignInUrl: `${baseUrl}/api/auth/signin/spotify`,
    callbackUrl: `${baseUrl}/api/auth/callback/spotify`,
    env: {
      hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    }
  });
}
