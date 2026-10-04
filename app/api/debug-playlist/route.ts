import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth";

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "No hay token" });

  const playlistId = "37i9dQZF1DXcBWIGoYBM5M";

  const r1 = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d1 = await r1.json();

  const r2 = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d2 = await r2.json();

  const r3 = await fetch("https://api.spotify.com/v1/me/playlists?limit=5", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d3 = await r3.json();

  return NextResponse.json({
    playlist_metadata: { status: r1.status, data: d1 },
    playlist_tracks: { status: r2.status, data: d2 },
    my_playlists: { status: r3.status, data: d3 },
  });
}
