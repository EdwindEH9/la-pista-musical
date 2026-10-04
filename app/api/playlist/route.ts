import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playlistUrl = searchParams.get("url");

  if (!playlistUrl) {
    return NextResponse.json({ error: "Falta la URL de la playlist" }, { status: 400 });
  }

  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    return NextResponse.json({ error: "URL de playlist invalida" }, { status: 400 });
  }

  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const tracks = await fetchAllTracks(token, playlistId);
    return NextResponse.json({
      total: tracks.length,
      valid: tracks.length,
      skipped: 0,
      tracks,
    });
  } catch (err) {
    console.error("Error al obtener playlist:", err);
    return NextResponse.json({ error: "Error al obtener la playlist" }, { status: 500 });
  }
}

function extractPlaylistId(input: string): string | null {
  try {
    if (input.startsWith("spotify:playlist:")) return input.split(":")[2];
    const url = new URL(input);
    const parts = url.pathname.split("/");
    const idx = parts.indexOf("playlist");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1].split("?")[0];
    return null;
  } catch { return null; }
}

async function fetchAllTracks(token: string, playlistId: string) {
  const tracks: Track[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Spotify response:", res.status, body);
      throw new Error(`Spotify API error: ${res.status}`);
    }

    const data = await res.json();

    for (const item of data.items) {
      const t = item?.item ?? item?.track;
      if (!t || !t.id || t.type !== "track") continue;
      tracks.push({
        id: t.id,
        name: t.name ?? "Desconocido",
        artist: t.artists?.map((a: any) => a.name).join(", ") ?? "Desconocido",
        album: t.album?.name ?? "Desconocido",
        cover: t.album?.images?.[0]?.url ?? null,
        duration_ms: t.duration_ms ?? 0,
      });
    }

    url = data.next ?? null;
  }

  return tracks;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  cover: string | null;
  duration_ms: number;
}
