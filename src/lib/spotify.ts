import SpotifyWebApi from "spotify-web-api-node";

export type ExtendedToken = {
  accessToken: string;
  accessTokenExpires: number; // epoch ms
  refreshToken: string;
};

export function createSpotifyClient(accessToken?: string, refreshToken?: string) {
  const client = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });
  if (accessToken) client.setAccessToken(accessToken);
  if (refreshToken) client.setRefreshToken(refreshToken);
  return client;
}

export async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
  try {
    const client = createSpotifyClient(token.accessToken, token.refreshToken);
    const { body } = await client.refreshAccessToken();
    return {
      accessToken: body.access_token,
      accessTokenExpires: Date.now() + (body.expires_in ?? 3600) * 1000,
      refreshToken: body.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    throw new Error("Failed to refresh Spotify access token");
  }
}

export function parsePlaylistId(input: string): string | null {
  // Accept full URL or raw ID
  try {
    if (/^[a-zA-Z0-9]{10,}$/.test(input)) return input;
    const url = new URL(input);
    const segments = url.pathname.split("/").filter(Boolean);
    const index = segments.findIndex((s) => s === "playlist");
    if (index >= 0 && segments[index + 1]) return segments[index + 1];
    return null;
  } catch {
    return null;
  }
}


