import { create } from "zustand";

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  cover: string | null;
  duration_ms: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  roundsWon: number;
}

type GamePhase = "setup" | "addPlayers" | "playing" | "revealed" | "finished";

interface GameStore {
  tracks: Track[];
  playedIds: Set<string>;
  currentTrack: Track | null;
  phase: GamePhase;
  round: number;
  players: Player[];
  lastWinnerId: string | null;

  setTracks: (tracks: Track[]) => void;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  goToGame: () => void;
  startGame: () => void;
  nextSong: () => void;
  reveal: () => void;
  awardPoints: (playerId: string, pista: number) => void;
  noWinner: () => void;
  reset: () => void;
}

const POINTS_BY_PISTA = [5, 4, 3, 2, 1];

export const useGameStore = create<GameStore>((set, get) => ({
  tracks: [],
  playedIds: new Set(),
  currentTrack: null,
  phase: "setup",
  round: 0,
  players: [],
  lastWinnerId: null,

  setTracks: (tracks) => set({ tracks }),

  addPlayer: (name) => {
    const { players } = get();
    if (players.length >= 8) return;
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    set({
      players: [
        ...players,
        { id: Date.now().toString(), name, score: 0, roundsWon: 0 },
      ],
    });
  },

  removePlayer: (id) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

  goToGame: () => set({ phase: "addPlayers" }),

  startGame: () => {
    const { tracks } = get();
    const track = pickRandom(tracks, new Set());
    if (!track) return;
    set({
      phase: "playing",
      currentTrack: track,
      playedIds: new Set([track.id]),
      round: 1,
      lastWinnerId: null,
    });
  },

  nextSong: () => {
    const { tracks, playedIds, round, players } = get();
    const remaining = tracks.filter((t) => !playedIds.has(t.id));

    if (remaining.length === 0 || round >= 15) {
      set({ phase: "finished" });
      return;
    }

    const track = pickRandom(remaining, playedIds);
    if (!track) return;
    const newPlayed = new Set(playedIds);
    newPlayed.add(track.id);
    set({
      currentTrack: track,
      playedIds: newPlayed,
      phase: "playing",
      round: round + 1,
      lastWinnerId: null,
    });
  },

  reveal: () => set({ phase: "revealed" }),

  awardPoints: (playerId, pista) => {
    const points = POINTS_BY_PISTA[pista] ?? 1;
    set((state) => ({
      lastWinnerId: playerId,
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, score: p.score + points, roundsWon: p.roundsWon + 1 }
          : p
      ),
    }));
  },

  noWinner: () => set({ lastWinnerId: null }),

  reset: () =>
    set({
      tracks: [],
      playedIds: new Set(),
      currentTrack: null,
      phase: "setup",
      round: 0,
      players: [],
      lastWinnerId: null,
    }),
}));

function pickRandom(tracks: Track[], played: Set<string>): Track | null {
  const pool = tracks.filter((t) => !played.has(t.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
