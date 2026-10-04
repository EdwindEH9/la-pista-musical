import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Falta el query" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta YOUTUBE_API_KEY" }, { status: 500 });
  }

  const searches = [
    `${query} official audio`,
    `${query} official video`,
    `${query}`,
  ];

  const results: string[] = [];

  for (const q of searches) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "3");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.items) {
      for (const item of data.items) {
        if (item.id?.videoId && !results.includes(item.id.videoId)) {
          results.push(item.id.videoId);
        }
      }
    }

    if (results.length >= 5) break;
  }

  if (results.length === 0) {
    return NextResponse.json({ error: "No se encontraron videos" }, { status: 404 });
  }

  return NextResponse.json({ videoIds: results });
}
