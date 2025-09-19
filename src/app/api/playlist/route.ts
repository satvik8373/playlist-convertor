import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createSpotifyClient, parsePlaylistId, ExtendedToken } from "@/lib/spotify";
import type { Session } from "next-auth";

type TrackItem = {
  name: string;
  artists: string[];
  album: string;
  durationMs: number;
  externalUrl: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id") || searchParams.get("playlistId") || "";
    const playlistId = parsePlaylistId(idParam || "");
    if (!playlistId) {
      return NextResponse.json({ error: "Invalid playlist URL or ID" }, { status: 400 });
    }

    console.log("[playlist-api] Fetching session...");
    const session = (await getServerSession(authOptions)) as (Session & { spotify?: ExtendedToken }) | null;
    console.log("[playlist-api] Raw session:", session);
    console.log("[playlist-api] Session details:", { 
      hasSession: !!session, 
      hasSpotify: !!session?.spotify, 
      hasToken: !!session?.spotify?.accessToken,
      sessionKeys: session ? Object.keys(session) : [],
      spotifyKeys: session?.spotify ? Object.keys(session.spotify) : [],
      accessTokenLength: session?.spotify?.accessToken?.length || 0
    });
    
    if (!session) {
      console.log("[playlist-api] No session found");
      return NextResponse.json({ error: "No session found - please sign in with Spotify first" }, { status: 401 });
    }
    
    if (!session.spotify) {
      console.log("[playlist-api] No spotify data in session");
      return NextResponse.json({ error: "No Spotify data in session - please sign in with Spotify first" }, { status: 401 });
    }
    
    if (!session.spotify.accessToken) {
      console.log("[playlist-api] No access token in spotify data");
      return NextResponse.json({ error: "No access token - please sign in with Spotify first" }, { status: 401 });
    }

  const accessToken = session.spotify.accessToken;
  const client = createSpotifyClient(accessToken);

  // Paginate up to 1000 items
  const limit = 100;
  let offset = 0;
  const tracks: TrackItem[] = [];

  for (let i = 0; i < 10; i++) {
    const { body } = await client.getPlaylistTracks(playlistId, { limit, offset });
    for (const item of (body.items ?? []) as Array<{ track?: { name?: string; artists?: Array<{ name?: string }>; album?: { name?: string }; duration_ms?: number; external_urls?: { spotify?: string } } }>) {
      const track = item.track;
      if (!track) continue;
      tracks.push({
        name: track.name ?? "",
        artists: (track.artists ?? []).map((a) => a.name ?? ""),
        album: track.album?.name ?? "",
        durationMs: track.duration_ms ?? 0,
        externalUrl: track.external_urls?.spotify ?? null,
      });
    }
    if (!body.next) break;
    offset += limit;
  }

  return NextResponse.json({ id: playlistId, count: tracks.length, tracks });
  } catch (error) {
    console.error("[playlist-api] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


