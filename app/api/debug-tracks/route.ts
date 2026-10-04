import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth";

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "No hay token" });

  const res = await fetch(
    "https://api.spotify.com/v1/playlists/7FXt5cORvUaZcIppJyow4r/items?limit=3",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  return NextResponse.json({
    status: res.status,
    raw_first_item: data.items?.[0],
    total: data.total,
  });
}
