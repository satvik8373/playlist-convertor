import { NextResponse } from "next/server";

// Convenience endpoint to start NextAuth Spotify login
export async function GET() {
  return NextResponse.redirect(new URL("/api/auth/signin", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}


