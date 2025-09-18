import { NextRequest, NextResponse } from "next/server";

// Proxy /api/callback to NextAuth's Spotify callback to satisfy custom redirect URIs
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = new URL("/api/auth/callback/spotify" + (url.search || ""), process.env.NEXTAUTH_URL || "http://localhost:3000");
  return NextResponse.redirect(target);
}


