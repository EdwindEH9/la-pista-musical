import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth";

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "No hay token" });

  const playlistId = "2dFqgQJzRUaVZ8XF2CE19p";
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  return NextResponse.json({
    status: res.status,
    total: data.total,
    first_item: data.items?.[0],
    error: data.error,
  });
}
