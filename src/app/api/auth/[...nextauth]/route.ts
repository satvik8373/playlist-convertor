import NextAuth, { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Account, Session } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { refreshAccessToken, ExtendedToken } from "@/lib/spotify";

const scopes = [
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes,
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  // Validate required env vars at startup
  ...(process.env.NEXTAUTH_SECRET ? {} : { 
    secret: "MISSING_NEXTAUTH_SECRET_ENV_VAR" 
  }),
  logger: {
    error(code, metadata) {
      console.error("[next-auth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[next-auth][warn]", code);
    },
  },
  callbacks: {
    async jwt({ token, account }: { token: JWT & { spotify?: ExtendedToken; error?: string }; account?: Account | null }) {
      // First sign in
      if (account && (account as unknown as { access_token?: string; refresh_token?: string; expires_in?: number }).access_token && (account as unknown as { refresh_token?: string }).refresh_token) {
        const raw = account as unknown as { access_token: string; refresh_token: string; expires_in?: number };
        const extended: ExtendedToken = {
          accessToken: raw.access_token,
          accessTokenExpires: Date.now() + (raw.expires_in ?? 3600) * 1000,
          refreshToken: raw.refresh_token,
        };
        return { ...token, spotify: extended };
      }

      // Subsequent calls, check expiry
      const current = token.spotify as ExtendedToken | undefined;
      if (!current) return token;
      if (Date.now() < current.accessTokenExpires - 15_000) {
        return token; // still valid
      }
      try {
        const refreshed = await refreshAccessToken(current);
        return { ...token, spotify: refreshed } as JWT & { spotify: ExtendedToken };
      } catch {
        return { ...token, error: "RefreshAccessTokenError" } as JWT & { error: string };
      }
    },
    async session({ session, token }: { session: Session & { spotify?: ExtendedToken; error?: string }; token: JWT & { spotify?: ExtendedToken; error?: string } }) {
      const spotify = token.spotify;
      if (spotify) {
        session.spotify = spotify;
      }
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/", // keep the app simple; sign-in button on home
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development" || process.env.VERCEL_ENV !== undefined,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


