import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    console.log("[test-session] Headers:", Object.fromEntries(req.headers.entries()));
    
    const session = await getServerSession(authOptions);
    console.log("[test-session] Raw session:", session);
    
    return NextResponse.json({
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      hasSpotify: !!(session as { spotify?: { accessToken?: string } })?.spotify,
      hasAccessToken: !!(session as { spotify?: { accessToken?: string } })?.spotify?.accessToken,
      session: session,
      headers: Object.fromEntries(req.headers.entries())
    });
  } catch (error) {
    console.error("[test-session] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
