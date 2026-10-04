"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const DURATIONS = [0.5, 1, 2, 3, 5];
const POINTS_BY_PISTA = [5, 4, 3, 2, 1];

export default function GameClient() {
  const {
    tracks, setTracks, addPlayer, removePlayer, goToGame, startGame,
    nextSong, reveal, awardPoints, noWinner,
    phase, currentTrack, round, players, lastWinnerId, reset,
  } = useGameStore();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioError, setAudioError] = useState("");
  const [info, setInfo] = useState<{ total: number; valid: number } | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showAward, setShowAward] = useState(false);

  const {
    playState, playCount, currentDuration, isExhausted,
    loadTrack, play, playFull, stopAll, reset: resetAudio,
  } = useAudioPlayer();

  useEffect(() => {
    if (phase === "playing" && currentTrack) {
      setAudioError("");
      setShowAward(false);
      resetAudio();
      fetch(`/api/deezer-search?artist=${encodeURIComponent(currentTrack.artist)}&title=${encodeURIComponent(currentTrack.name)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.previewUrl) {
            loadTrack(data.previewUrl).catch(() => setAudioError("No se pudo cargar el audio."));
          } else {
            setAudioError("Sin preview para esta cancion.");
          }
        })
        .catch(() => setAudioError("Error buscando audio."));
    }
  }, [currentTrack?.id, phase]);

  useEffect(() => {
    if (phase === "revealed") { setShowAward(true); playFull(); }
    if (phase === "setup") stopAll();
  }, [phase]);

  async function handleLoad() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error desconocido"); return; }
      setTracks(data.tracks);
      setInfo({ total: data.total, valid: data.valid });
    } catch { setError("No se pudo conectar."); }
    finally { setLoading(false); }
  }

  function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    addPlayer(newPlayerName.trim());
    setNewPlayerName("");
  }

  if (phase === "finished") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-5 px-4 py-safe">
        <div className="text-6xl">🏆</div>
        <h1 className="text-4xl font-black text-white">Fin del Juego</h1>
        <p className="text-zinc-400">{round} rondas jugadas</p>
        <div className="w-full max-w-sm space-y-3 mt-2">
          {sorted.map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between px-5 py-4 rounded-2xl ${i === 0 ? "bg-yellow-500/20 border-2 border-yellow-500" : "bg-zinc-900 border border-zinc-700"}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{medals[i] ?? "🎵"}</span>
                <div>
                  <p className={`font-black text-lg ${i === 0 ? "text-yellow-400" : "text-white"}`}>{p.name}</p>
                  <p className="text-zinc-500 text-xs">{p.roundsWon} rondas ganadas</p>
                </div>
              </div>
              <span className={`text-2xl font-black ${i === 0 ? "text-yellow-400" : "text-green-400"}`}>{p.score} pts</span>
            </div>
          ))}
        </div>
        <button
          onClick={reset}
          className="mt-4 w-full max-w-sm bg-green-500 hover:bg-green-400 active:scale-95 text-black font-bold py-4 rounded-2xl transition-all text-lg"
        >
          Jugar de nuevo
        </button>
      </main>
    );
  }

  if (phase === "revealed" && currentTrack) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-start gap-4 px-4 pt-12 pb-8 overflow-y-auto">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Ronda {round}</p>

        <div className="flex items-center gap-4 w-full max-w-sm">
          {currentTrack.cover && (
            <img src={currentTrack.cover} alt="cover" className="w-24 h-24 rounded-xl shadow-xl flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white leading-tight truncate">{currentTrack.name}</h2>
            <p className="text-green-400 font-bold truncate">{currentTrack.artist}</p>
            <p className="text-zinc-500 text-sm truncate">{currentTrack.album}</p>
          </div>
        </div>

        {showAward && players.length > 0 && (
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3">
            {!lastWinnerId ? (
              <>
                <p className="text-white font-bold text-center text-sm">
                  ¿Quien adivino? ({POINTS_BY_PISTA[playCount - 1] ?? 1} pts)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => awardPoints(p.id, playCount - 1)}
                      className="bg-zinc-800 active:bg-green-500 active:text-black text-white font-bold py-3 px-3 rounded-xl transition-colors text-sm min-h-[48px]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={noWinner}
                  className="w-full text-zinc-500 active:text-zinc-300 text-xs py-2 transition-colors"
                >
                  Nadie adivino
                </button>
              </>
            ) : (
              <p className="text-green-400 font-bold text-center py-2">
                {players.find((p) => p.id === lastWinnerId)?.name} +{POINTS_BY_PISTA[playCount - 1] ?? 1} pts 🎉
              </p>
            )}
          </div>
        )}

        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3 text-center">Marcador</p>
          <div className="space-y-2">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{["🥇","🥈","🥉"][i] ?? "🎵"}</span>
                  <span className={`font-bold text-sm ${p.id === lastWinnerId ? "text-green-400" : "text-white"}`}>{p.name}</span>
                </div>
                <span className="text-green-400 font-black">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { stopAll(); nextSong(); }}
          className="w-full max-w-sm bg-green-500 active:bg-green-400 active:scale-95 text-black font-bold py-4 rounded-2xl transition-all text-lg"
        >
          Siguiente →
        </button>
      </main>
    );
  }

  if (phase === "playing" && currentTrack) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-between px-4 pt-10 pb-10">
        <div className="flex items-center justify-between w-full max-w-sm">
          <p className="text-zinc-500 text-sm uppercase tracking-widest">Ronda {round}</p>
          {players.length > 0 && (
            <div className="flex gap-4">
              {sortedPlayers.slice(0, 3).map((p) => (
                <div key={p.id} className="text-center">
                  <p className="text-green-400 font-black text-sm">{p.score}</p>
                  <p className="text-zinc-600 text-xs">{p.name.split(" ")[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="w-44 h-44 rounded-3xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center shadow-2xl">
            <span className="text-8xl">?</span>
          </div>

          <div className="flex gap-2">
            {DURATIONS.map((d, i) => (
              <div key={d} className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                i < playCount ? "bg-green-500 text-black scale-110"
                : i === playCount ? "bg-zinc-700 text-white border border-zinc-500"
                : "bg-zinc-900 text-zinc-600"
              }`}>
                {d}s
              </div>
            ))}
          </div>

          {audioError && (
            <p className="text-yellow-400 text-sm text-center max-w-xs">{audioError}</p>
          )}

          <button
            onClick={play}
            disabled={playState === "loading" || playState === "playing" || isExhausted}
            className={`w-52 h-52 rounded-full font-black transition-all duration-150 flex flex-col items-center justify-center gap-2 shadow-2xl select-none
              ${playState === "playing"
                ? "bg-green-400 shadow-green-500/50 scale-105 text-black"
                : isExhausted
                ? "bg-zinc-700 text-zinc-500"
                : "bg-green-500 active:scale-95 active:bg-green-400 shadow-green-900/50 text-black"
              }`}
          >
            {playState === "loading" && <>
              <span className="text-5xl animate-pulse">♪</span>
              <span className="text-base font-bold">Buscando...</span>
            </>}
            {playState === "playing" && <>
              <span className="text-6xl animate-pulse">||</span>
              <span className="text-base font-bold">{currentDuration}s</span>
            </>}
            {(playState === "paused" || playState === "idle") && !isExhausted && <>
              <span className="text-6xl">▶</span>
              <span className="text-base font-bold">{currentDuration}s</span>
            </>}
            {isExhausted && <span className="text-base font-bold">Agotado</span>}
          </button>

          {isExhausted && (
            <p className="text-zinc-500 text-sm">Usaste todas las pistas</p>
          )}
        </div>

        <button
          onClick={reveal}
          className="w-full max-w-sm bg-zinc-800 active:bg-zinc-700 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all border border-zinc-600 text-lg"
        >
          Revelar Cancion 👁
        </button>
      </main>
    );
  }

  if (phase === "addPlayers") {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-5 px-4 py-8">
        <div className="text-center space-y-1">
          <div className="text-5xl">👥</div>
          <h1 className="text-3xl font-black text-white">Jugadores</h1>
          <p className="text-zinc-400 text-sm">Hasta 8 jugadores</p>
        </div>

        <form onSubmit={handleAddPlayer} className="w-full max-w-sm flex gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Nombre del jugador..."
            maxLength={20}
            className="flex-1 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 outline-none focus:border-green-500 transition-colors text-base"
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim() || players.length >= 8}
            className="bg-green-500 active:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black text-2xl w-14 rounded-xl transition-colors"
          >
            +
          </button>
        </form>

        {players.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span>{["🥇","🥈","🥉"][i] ?? "🎵"}</span>
                  <span className="text-white font-bold">{p.name}</span>
                </div>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-zinc-500 active:text-red-400 transition-colors text-xl w-10 h-10 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="w-full max-w-sm space-y-3 mt-2">
          <button
            onClick={startGame}
            disabled={players.length === 0}
            className="w-full bg-green-500 active:bg-green-400 active:scale-95 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-2xl transition-all text-lg"
          >
            {players.length === 0 ? "Agrega jugadores" : `Empezar (${players.length} jugadores)`}
          </button>

          {players.length === 0 && (
            <button
              onClick={startGame}
              className="w-full text-zinc-500 active:text-zinc-300 text-sm py-3 transition-colors"
            >
              Jugar sin puntaje →
            </button>
          )}

          <button
            onClick={() => useGameStore.getState().reset()}
            className="w-full bg-zinc-900 active:bg-zinc-800 text-zinc-400 font-bold py-3 rounded-2xl transition-all border border-zinc-800 text-sm"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="text-center space-y-2">
        <div className="text-6xl">🎵</div>
        <h1 className="text-4xl font-black text-white">La Pista Musical</h1>
        <p className="text-zinc-400">Pega el enlace de tu playlist</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://open.spotify.com/playlist/..."
          className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-4 outline-none focus:border-green-500 transition-colors text-base"
        />
        <button
          onClick={handleLoad}
          disabled={loading || !url.trim()}
          className="w-full bg-green-500 active:bg-green-400 active:scale-95 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-all text-lg"
        >
          {loading ? "Cargando..." : "Cargar Playlist"}
        </button>
      </div>

      {error && (
        <div className="w-full max-w-md bg-red-900/50 border border-red-500 text-red-200 px-5 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {info && (
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold text-lg">Playlist cargada ✅</h2>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-3xl font-black text-white">{info.total}</div>
              <div className="text-zinc-400 text-xs mt-1">Total</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-3xl font-black text-green-400">{info.valid}</div>
              <div className="text-zinc-400 text-xs mt-1">Jugables</div>
            </div>
          </div>
          <button
            onClick={goToGame}
            className="w-full bg-green-500 active:bg-green-400 active:scale-95 text-black font-bold py-4 rounded-xl transition-all text-lg"
          >
            Continuar →
          </button>
        </div>
      )}
    </main>
  );
}
