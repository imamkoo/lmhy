"use client";

import { useState } from "react";

const ACTIVITY_TYPES = [
  "Meditasi",
  "Olahraga",
  "Jalan-jalan",
  "Jurnal",
  "Sosialisasi",
  "Tidur",
  "Lainnya",
];

type Props = {
  onSave: (data: {
    type: string;
    name: string;
    description?: string;
    durationMinutes: number;
  }) => Promise<void>;
};

export function ActivityLogger({ onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama aktivitas wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        type,
        name: name.trim(),
        description: description.trim() || undefined,
        durationMinutes: duration,
      });
      setName("");
      setDescription("");
      setDuration(15);
      setOpen(false);
    } catch {
      setError("Gagal menyimpan aktivitas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full lmhy-btn text-2xl text-white shadow-lg transition hover:opacity-90 md:bottom-8 md:right-8"
        aria-label="Catat aktivitas"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="activity-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="activity-title" className="text-lg font-semibold">
                Catat aktivitas
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Jenis</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nama</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  placeholder="Contoh: Meditasi pagi"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Durasi (menit): {duration}
                </label>
                <input
                  type="range"
                  min={1}
                  max={180}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-[var(--main-color)]"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl lmhy-btn py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
