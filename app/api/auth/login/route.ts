import { NextResponse } from "next/server";
import { getSpotifyAuthURL } from "@/lib/spotify";

export async function GET() {
  const state = Math.random().toString(36).substring(2, 15);
  const authURL = getSpotifyAuthURL(state);

  const response = NextResponse.redirect(authURL);

  response.cookies.delete("spotify_auth_state");
  response.cookies.delete("spotify_access_token");
  response.cookies.delete("spotify_refresh_token");
  response.cookies.delete("spotify_token_expires_at");

  response.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    secure: false,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
