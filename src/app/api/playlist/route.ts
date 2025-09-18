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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id") || searchParams.get("playlistId") || "";
  const playlistId = parsePlaylistId(idParam || "");
  if (!playlistId) {
    return NextResponse.json({ error: "Invalid playlist URL or ID" }, { status: 400 });
  }

  const session = (await getServerSession(authOptions)) as (Session & { spotify?: ExtendedToken }) | null;
  if (!session || !session.spotify?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}


