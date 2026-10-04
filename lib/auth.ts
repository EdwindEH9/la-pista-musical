import { cookies } from "next/headers";
import { refreshAccessToken } from "./spotify";

export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;
  const expiresAt = cookieStore.get("spotify_token_expires_at")?.value;

  if (!accessToken || !refreshToken || !expiresAt) {
    return null;
  }

  const expiresAtMs = parseInt(expiresAt, 10);
  const fiveMinutes = 5 * 60 * 1000;
  if (Date.now() < expiresAtMs - fiveMinutes) {
    return accessToken;
  }

  try {
    const newTokenData = await refreshAccessToken(refreshToken);
    return newTokenData.access_token;
  } catch {
    return null;
  }
}
