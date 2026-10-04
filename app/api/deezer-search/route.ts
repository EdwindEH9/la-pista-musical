import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist") ?? "";
  const title = searchParams.get("title") ?? "";

  if (!artist && !title) {
    return NextResponse.json({ error: "Faltan parametros" }, { status: 400 });
  }

  const query = encodeURIComponent(`artist:"${artist}" track:"${title}"`);
  const url = `https://api.deezer.com/search?q=${query}&limit=5`;

  const res = await fetch(url);
  const data = await res.json();

  const track = data.data?.find((t: any) => t.preview);

  if (!track) {
    const fallbackQuery = encodeURIComponent(`${artist} ${title}`);
    const fallbackRes = await fetch(`https://api.deezer.com/search?q=${fallbackQuery}&limit=5`);
    const fallbackData = await fallbackRes.json();
    const fallbackTrack = fallbackData.data?.find((t: any) => t.preview);

    if (!fallbackTrack) {
      return NextResponse.json({ error: "No se encontro preview" }, { status: 404 });
    }

    return NextResponse.json({
      previewUrl: `/api/audio-proxy?url=${encodeURIComponent(fallbackTrack.preview)}`,
      title: fallbackTrack.title,
      artist: fallbackTrack.artist?.name,
    });
  }

  return NextResponse.json({
    previewUrl: `/api/audio-proxy?url=${encodeURIComponent(track.preview)}`,
    title: track.title,
    artist: track.artist?.name,
  });
}
