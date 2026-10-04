import { useRef, useState, useCallback } from "react";

export type PlayState = "idle" | "loading" | "playing" | "paused";

const DURATIONS = [0.5, 1, 2, 3, 5];
const START_SECONDS = 8;

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [playCount, setPlayCount] = useState(0);

  const clearTimer = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const loadTrack = useCallback(async (previewUrl: string) => {
    clearTimer();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    setPlayState("loading");
    setPlayCount(0);

    const audio = new Audio(previewUrl);
    audio.preload = "auto";

    await new Promise<void>((resolve, reject) => {
      audio.oncanplaythrough = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.load();
    });

    audioRef.current = audio;
    setPlayState("paused");
  }, [clearTimer]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || playCount >= DURATIONS.length) return;

    clearTimer();
    const duration = DURATIONS[playCount];

    audio.currentTime = START_SECONDS;
    audio.volume = 1;
    audio.play().then(() => {
      setPlayState("playing");
      stopTimerRef.current = setTimeout(() => {
        audio.pause();
        setPlayState("paused");
        setPlayCount((prev) => prev + 1);
      }, duration * 1000);
    }).catch((err) => {
      console.error("Error reproduciendo:", err);
      setPlayState("paused");
    });
  }, [playCount, clearTimer]);

  const playFull = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearTimer();
    audio.currentTime = 0;
    audio.volume = 0.8;
    audio.play().catch(console.error);
    setPlayState("playing");
  }, [clearTimer]);

  const stopAll = useCallback(() => {
    clearTimer();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayState("paused");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayCount(0);
    setPlayState("idle");
  }, [clearTimer]);

  return {
    playState,
    playCount,
    currentDuration: DURATIONS[playCount] ?? null,
    isExhausted: playCount >= DURATIONS.length,
    durations: DURATIONS,
    loadTrack,
    play,
    playFull,
    stopAll,
    reset,
  };
}
