import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playlistUrl = searchParams.get("url");

  if (!playlistUrl) {
    return NextResponse.json({ error: "Falta la URL" }, { status: 400 });
  }

  const parsed = extractIdAndType(playlistUrl.trim());
  if (!parsed) {
    return NextResponse.json({
      error: "URL invalida. Pega un link de playlist o album de Spotify.",
    }, { status: 400 });
  }

  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const tracks = parsed.type === "album"
      ? await fetchAlbumTracks(token, parsed.id)
      : await fetchPlaylistTracks(token, parsed.id);

    return NextResponse.json({
      total: tracks.length,
      valid: tracks.length,
      skipped: 0,
      tracks,
    });
  } catch (err) {
    console.error("Error al obtener tracks:", err);
    return NextResponse.json({ error: "Error al obtener las canciones" }, { status: 500 });
  }
}

function extractIdAndType(input: string): { id: string; type: "playlist" | "album" } | null {
  try {
    if (input.startsWith("spotify:playlist:")) {
      return { id: input.split(":")[2], type: "playlist" };
    }
    if (input.startsWith("spotify:album:")) {
      return { id: input.split(":")[2], type: "album" };
    }

    const playlistMatch = input.match(/playlist\/([a-zA-Z0-9]+)/);
    if (playlistMatch?.[1]) return { id: playlistMatch[1], type: "playlist" };

    const albumMatch = input.match(/album\/([a-zA-Z0-9]+)/);
    if (albumMatch?.[1]) return { id: albumMatch[1], type: "album" };

    return null;
  } catch {
    return null;
  }
}

async function fetchPlaylistTracks(token: string, playlistId: string): Promise<Track[]> {
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

async function fetchAlbumTracks(token: string, albumId: string): Promise<Track[]> {
  const albumRes: Response = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!albumRes.ok) throw new Error(`Spotify API error: ${albumRes.status}`);
  const album: SpotifyAlbum = await albumRes.json();

  const tracks: Track[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
    const data: SpotifyAlbumTracksResponse = await response.json();

    for (const t of data.items) {
      if (!t?.id) continue;
      tracks.push({
        id: t.id,
        name: t.name ?? "Desconocido",
        artist: t.artists?.map((a: SpotifyArtist) => a.name).join(", ") ?? "Desconocido",
        album: album.name ?? "Desconocido",
        cover: album.images?.[0]?.url ?? null,
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

interface SpotifyArtist { name: string; }

interface SpotifyTrack {
  id: string;
  name: string;
  type: string;
  artists: SpotifyArtist[];
  album: { name: string; images: { url: string }[]; };
  duration_ms: number;
}

interface SpotifyAlbumTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
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

interface SpotifyAlbumTracksResponse {
  items: SpotifyAlbumTrack[];
  next: string | null;
}

interface SpotifyAlbum {
  name: string;
  images: { url: string }[];
}
