"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_AUDIO =
  "https://cdn.pixabay.com/audio/2022/03/15/audio_8cb7499ede.mp3";

const TREE_ANIM = [
  "animate-tree-sway",
  "animate-tree-sway-slow",
  "animate-tree-sway-slower",
];

export function MindfulForest() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [timerOn, setTimerOn] = useState(false);

  const audioUrl =
    process.env.NEXT_PUBLIC_FOREST_AUDIO_URL ?? DEFAULT_AUDIO;

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!timerOn || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setTimerOn(false);
          setPlaying(false);
          audioRef.current?.pause();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerOn, secondsLeft]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().catch(() => {});
      setPlaying(true);
    }
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="space-y-8">
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Suara alam untuk meditasi singkat. Audio testing: Pixabay (ganti dengan asset
        Anda di produksi — lihat AUDIO_SOURCES.md).
      </p>

      <div className="relative flex h-48 items-end justify-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-t from-emerald-900 to-emerald-600 px-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`origin-bottom rounded-t-full bg-emerald-800/80 ${playing ? TREE_ANIM[i] : ""}`}
            style={{
              width: `${40 + i * 20}px`,
              height: `${80 + i * 30}px`,
            }}
          />
        ))}
      </div>

      <audio ref={audioRef} src={audioUrl} loop preload="none" />

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700"
        >
          {playing ? "Jeda suara" : "Putar suara"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSecondsLeft(300);
            setTimerOn(true);
            if (!playing) {
              audioRef.current?.play().catch(() => {});
              setPlaying(true);
            }
          }}
          className="rounded-xl border border-emerald-600 px-6 py-2.5 font-medium text-emerald-700 dark:text-emerald-400"
        >
          Mulai timer 5 menit
        </button>
      </div>

      <div className="mx-auto max-w-sm space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <label className="block text-sm font-medium">
          Volume: {Math.round(volume * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-emerald-600"
        />
        <p className="text-center text-2xl font-mono tabular-nums text-emerald-800 dark:text-emerald-300">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
        {timerOn && (
          <p className="text-center text-xs text-slate-500">Timer berjalan</p>
        )}
      </div>
    </div>
  );
}
