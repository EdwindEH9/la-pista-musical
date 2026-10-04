import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/spotify";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${APP_URL}/?error=access_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/?error=missing_params`);
  }

  const savedState = request.cookies.get("spotify_auth_state")?.value;

  if (state !== savedState) {
    return NextResponse.redirect(`${APP_URL}/?error=state_mismatch`);
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    const response = NextResponse.redirect(`${APP_URL}/game`);

    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: false,
      maxAge: tokenData.expires_in,
      path: "/",
      sameSite: "lax",
    });

    response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    response.cookies.set("spotify_token_expires_at", String(expiresAt), {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    response.cookies.delete("spotify_auth_state");

    return response;
  } catch (err) {
    console.error("Error en callback:", err);
    return NextResponse.redirect(`${APP_URL}/?error=token_exchange_failed`);
  }
}
