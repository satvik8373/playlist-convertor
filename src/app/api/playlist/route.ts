import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createSpotifyClient, parsePlaylistId } from "@/lib/spotify";

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

  const session = await getServerSession(authOptions);
  if (!session || !(session as any).spotify?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).spotify.accessToken as string;
  const client = createSpotifyClient(accessToken);

  // Paginate up to 1000 items
  const limit = 100;
  let offset = 0;
  const tracks: TrackItem[] = [];

  for (let i = 0; i < 10; i++) {
    const { body } = await client.getPlaylistTracks(playlistId, { limit, offset });
    for (const item of body.items ?? []) {
      const track = (item as any).track;
      if (!track) continue;
      tracks.push({
        name: track.name,
        artists: (track.artists ?? []).map((a: any) => a.name),
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


