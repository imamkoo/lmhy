'use client';

import { useState } from "react";
import { createListeningSlot } from "@/app/actions/booking";

export interface SlotCalendarProps {
  canSchedule: boolean;
  onCreated?: () => void;
}

const formatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

const fieldClassName =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const labelClassName = "block text-xs font-semibold text-muted-foreground";

export default function SlotCalendar({ canSchedule, onCreated }: SlotCalendarProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("50000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  if (!canSchedule) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!date || !time) {
      setFeedback({ kind: "error", message: "Tanggal dan jam sesi wajib diisi." });
      return;
    }

    const durationMin = Number(duration);
    const priceIdr = Number(price);

    if (!Number.isInteger(durationMin) || durationMin <= 0) {
      setFeedback({ kind: "error", message: "Durasi sesi harus berupa angka menit lebih besar dari nol." });
      return;
    }

    if (!Number.isInteger(priceIdr) || priceIdr < 0) {
      setFeedback({ kind: "error", message: "Harga sesi harus berupa angka Rupiah yang tidak negatif." });
      return;
    }

    const start = new Date(`${date}T${time}:00+07:00`);

    if (Number.isNaN(start.getTime())) {
      setFeedback({ kind: "error", message: "Format tanggal atau jam tidak valid." });
      return;
    }

    if (start.getTime() <= Date.now()) {
      setFeedback({ kind: "error", message: "Waktu mulai sesi harus berada di masa depan." });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createListeningSlot({
        startTime: start.toISOString(),
        durationMin,
        priceIdr,
      });

      if (result.ok) {
        setFeedback({
          kind: "success",
          message: `Jadwal sesi ${formatter.format(start)} WIB berhasil dibuat.`,
        });
        setDate("");
        setTime("");
        onCreated?.();
      } else {
        setFeedback({
          kind: "error",
          message: result.message ?? "Jadwal sesi gagal dibuat. Silakan coba lagi.",
        });
      }
    } catch {
      setFeedback({ kind: "error", message: "Terjadi kesalahan saat membuat jadwal sesi." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
      <h3 className="text-base font-bold">Buat Jadwal Sesi</h3>
      <p className="mt-1 text-xs leading-relaxed opacity-80">
        Tentukan waktu, durasi, dan harga sesi. Harga dalam Rupiah (IDR).
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="slot-date" className={labelClassName}>
              Tanggal
            </label>
            <input
              id="slot-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`mt-1 ${fieldClassName}`}
            />
          </div>
          <div>
            <label htmlFor="slot-time" className={labelClassName}>
              Jam (WIB)
            </label>
            <input
              id="slot-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={`mt-1 ${fieldClassName}`}
            />
          </div>
          <div>
            <label htmlFor="slot-duration" className={labelClassName}>
              Durasi (menit)
            </label>
            <input
              id="slot-duration"
              type="number"
              min={1}
              step={1}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className={`mt-1 ${fieldClassName}`}
            />
          </div>
          <div>
            <label htmlFor="slot-price" className={labelClassName}>
              Harga (IDR)
            </label>
            <input
              id="slot-price"
              type="number"
              min={0}
              step={1000}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={`mt-1 ${fieldClassName}`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : "Simpan Jadwal"}
        </button>

        {feedback && (
          <p
            role={feedback.kind === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
              feedback.kind === "error"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-muted/40"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </form>
    </div>
  );
}
