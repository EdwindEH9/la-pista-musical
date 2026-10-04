import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export async function GET() {
  const response = NextResponse.redirect(`${APP_URL}/api/auth/login`);

  response.cookies.delete("spotify_access_token");
  response.cookies.delete("spotify_refresh_token");
  response.cookies.delete("spotify_token_expires_at");
  response.cookies.delete("spotify_auth_state");

  return response;
}
