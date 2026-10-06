import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playlistUrl = searchParams.get("url");

  if (!playlistUrl) {
    return NextResponse.json({ error: "Falta la URL de la playlist" }, { status: 400 });
  }

  const playlistId = extractPlaylistId(playlistUrl.trim());
  if (!playlistId) {
    return NextResponse.json({ 
      error: "URL de playlist invalida",
      received: playlistUrl,
    }, { status: 400 });
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
    const cleaned = input.trim();

    if (cleaned.startsWith("spotify:playlist:")) {
      return cleaned.split(":")[2] ?? null;
    }

    const patterns = [
      /playlist\/([a-zA-Z0-9]+)/,
      /playlist:([a-zA-Z0-9]+)/,
      /^([a-zA-Z0-9]{22})$/,
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match?.[1]) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchAllTracks(token: string, playlistId: string): Promise<Track[]> {
  const tracks: Track[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Spotify response:", response.status, body);
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data: SpotifyPlaylistResponse = await response.json();

    for (const item of data.items) {
      const t = item?.item ?? item?.track;
      if (!t || !t.id || t.type !== "track") continue;
      tracks.push({
        id: t.id,
        name: t.name ?? "Desconocido",
        artist: t.artists?.map((a: SpotifyArtist) => a.name).join(", ") ?? "Desconocido",
        album: t.album?.name ?? "Desconocido",
        cover: t.album?.images?.[0]?.url ?? null,
        duration_ms: t.duration_ms ?? 0,
      });
    }

    nextUrl = data.next ?? null;
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

interface SpotifyArtist {
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  type: string;
  artists: SpotifyArtist[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

interface SpotifyPlaylistItem {
  item?: SpotifyTrack;
  track?: SpotifyTrack;
}

interface SpotifyPlaylistResponse {
  items: SpotifyPlaylistItem[];
  next: string | null;
}
