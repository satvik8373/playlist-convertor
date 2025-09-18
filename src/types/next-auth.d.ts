import { ExtendedToken } from "@/lib/spotify";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    spotify?: ExtendedToken;
    error?: string;
  }
}


