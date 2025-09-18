import { ExtendedToken } from "@/lib/spotify";

declare module "next-auth" {
  interface Session {
    spotify?: ExtendedToken;
    error?: string;
  }
}


