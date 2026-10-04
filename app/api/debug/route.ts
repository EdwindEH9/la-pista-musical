import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    client_id: process.env.SPOTIFY_CLIENT_ID?.slice(0, 6) + "...",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });
}
