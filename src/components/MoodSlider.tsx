"use client";

import { useState } from "react";
import { moodEmoji, moodGradient, moodLabel } from "@/lib/mood";

type Props = {
  onSave: (score: number, note?: string) => Promise<void>;
};

export function MoodSlider({ onSave }: Props) {
  const [score, setScore] = useState(50);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave(score, note || undefined);
      setMessage("Mood hari ini tersimpan.");
      setNote("");
    } catch {
      setMessage("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`rounded-2xl bg-gradient-to-br p-8 text-center text-white shadow-lg transition-all duration-300 ${moodGradient(score)}`}
      >
        <p className="text-6xl" aria-hidden>
          {moodEmoji(score)}
        </p>
        <p className="mt-2 text-4xl font-bold tabular-nums">{score}</p>
        <p className="mt-1 text-lg opacity-90">{moodLabel(score)}</p>
      </div>

      <div>
        <label htmlFor="mood-range" className="mb-2 block text-sm font-medium">
          Geser untuk menilai suasana hati (0–100)
        </label>
        <input
          id="mood-range"
          type="range"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="h-3 w-full cursor-pointer accent-[var(--main-color)]"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <div>
        <label htmlFor="mood-note" className="mb-1 block text-sm font-medium">
          Catatan opsional
        </label>
        <textarea
          id="mood-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Apa yang Anda rasakan hari ini?"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl lmhy-btn py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Menyimpan…" : "Simpan mood"}
      </button>

      {message && (
        <p className="text-center text-sm text-[var(--color-brand)] dark:text-[var(--main-color)]">{message}</p>
      )}
    </form>
  );
}
