"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-5xl font-black text-white">La Pista Musical</h1>
      {error && <p className="text-red-400">{error}</p>}
      <a href="/api/auth/login" className="bg-green-500 text-black font-bold px-8 py-4 rounded-full">
        Iniciar sesion con Spotify
      </a>
      <p className="text-zinc-600 text-xs">Solo necesitamos acceso a tus playlists.</p>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
