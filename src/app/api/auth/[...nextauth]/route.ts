import NextAuth, { NextAuthOptions } from "next-auth";
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
  callbacks: {
    async jwt({ token, account }) {
      // First sign in
      if (account && account.access_token && account.refresh_token) {
        const extended: ExtendedToken = {
          accessToken: account.access_token as string,
          accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
          refreshToken: account.refresh_token as string,
        };
        return { ...token, spotify: extended };
      }

      // Subsequent calls, check expiry
      const current = (token as any).spotify as ExtendedToken | undefined;
      if (!current) return token;
      if (Date.now() < current.accessTokenExpires - 15_000) {
        return token; // still valid
      }
      try {
        const refreshed = await refreshAccessToken(current);
        return { ...token, spotify: refreshed };
      } catch {
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      const spotify = (token as any).spotify as ExtendedToken | undefined;
      if (spotify) {
        (session as any).spotify = spotify;
      }
      (session as any).error = (token as any).error;
      return session;
    },
  },
  pages: {
    signIn: "/", // keep the app simple; sign-in button on home
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


