'use client';

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */
import { useEffect, useState, useCallback } from "react";
import { createListeningSlot, cancelListeningSlot, updateListeningSlot } from "@/app/actions/booking";
import { createClient } from "@/lib/supabase/client";

export interface SlotCalendarProps {
  canSchedule: boolean;
  onCreated?: () => void;
}

export interface SlotRow {
  id: string;
  start_time: string;
  duration_min: number;
  price_idr: number;
  status: string;
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

const idrFormatter = new Intl.NumberFormat("id-ID");

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
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("60");
  const [editPrice, setEditPrice] = useState("50000");
  const [editSaving, setEditSaving] = useState(false);

  const loadSlots = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSlots([]);
        return;
      }
      const { data } = await supabase
        .from("listening_slots")
        .select("id, start_time, duration_min, price_idr, status")
        .eq("provider_id", user.id)
        .in("status", ["AVAILABLE", "RESERVED"])
        .order("start_time", { ascending: true });
      setSlots((data as unknown as SlotRow[]) || []);
    } catch {
      // silent
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!canSchedule) {
      queueMicrotask(() => {
        if (!cancelled) setSlotsLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    void loadSlots();
    return () => {
      cancelled = true;
    };
  }, [canSchedule, loadSlots]);

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
        await loadSlots();
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

  const handleCancel = async (slotId: string) => {
    if (!window.confirm("Batalkan jadwal sesi ini?")) return;
    setCancellingId(slotId);
    setFeedback(null);
    try {
      const res = await cancelListeningSlot(slotId);
      if (res.ok) {
        setFeedback({ kind: "success", message: "Jadwal sesi berhasil dibatalkan." });
        await loadSlots();
        onCreated?.();
      } else {
        setFeedback({ kind: "error", message: res.message ?? "Gagal membatalkan jadwal." });
      }
    } catch {
      setFeedback({ kind: "error", message: "Terjadi kesalahan saat membatalkan jadwal." });
    } finally {
      setCancellingId(null);
    }
  };

  const startEdit = (slot: SlotRow) => {
    const d = new Date(slot.start_time);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    setEditingId(slot.id);
    setEditDate(`${yyyy}-${mm}-${dd}`);
    setEditTime(`${hh}:${mi}`);
    setEditDuration(String(slot.duration_min));
    setEditPrice(String(slot.price_idr));
    setFeedback(null);
  };

  const handleEditSave = async (slotId: string) => {
    if (!editDate || !editTime) {
      setFeedback({ kind: "error", message: "Tanggal dan jam sesi wajib diisi." });
      return;
    }
    const durationMin = Number(editDuration);
    const priceIdr = Number(editPrice);
    if (!Number.isInteger(durationMin) || durationMin <= 0) {
      setFeedback({ kind: "error", message: "Durasi sesi harus berupa angka menit lebih besar dari nol." });
      return;
    }
    if (!Number.isInteger(priceIdr) || priceIdr < 0) {
      setFeedback({ kind: "error", message: "Harga sesi harus berupa angka Rupiah yang tidak negatif." });
      return;
    }
    const start = new Date(`${editDate}T${editTime}:00+07:00`);
    if (Number.isNaN(start.getTime())) {
      setFeedback({ kind: "error", message: "Format tanggal atau jam tidak valid." });
      return;
    }
    if (start.getTime() <= Date.now()) {
      setFeedback({ kind: "error", message: "Waktu mulai sesi harus berada di masa depan." });
      return;
    }
    setEditSaving(true);
    setFeedback(null);
    try {
      const res = await updateListeningSlot({
        slotId,
        startTime: start.toISOString(),
        durationMin,
        priceIdr,
      });
      if (res.ok) {
        setFeedback({ kind: "success", message: "Jadwal sesi berhasil diperbarui." });
        setEditingId(null);
        await loadSlots();
        onCreated?.();
      } else {
        setFeedback({ kind: "error", message: res.message ?? "Gagal memperbarui jadwal." });
      }
    } catch {
      setFeedback({ kind: "error", message: "Terjadi kesalahan saat memperbarui jadwal." });
    } finally {
      setEditSaving(false);
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

      <div className="mt-6 border-t border-border pt-5">
        <h4 className="text-sm font-bold">Jadwal Anda</h4>
        <p className="mt-1 text-[11px] leading-relaxed opacity-60">
          Jadwal disimpan di database aplikasi dan tidak tercatat di blockchain. Hanya jadwal berstatus tersedia yang dapat diubah atau dibatalkan.
        </p>
        {slotsLoading ? (
          <p className="mt-3 text-xs opacity-60">Memuat jadwal…</p>
        ) : slots.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3 text-xs opacity-70">
            Belum ada jadwal sesi. Buat jadwal pertama di atas.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {slots.map((slot) => {
              const isAvailable = slot.status === "AVAILABLE";
              const slotDate = new Date(slot.start_time);
              const label = Number.isNaN(slotDate.getTime()) ? slot.start_time : `${formatter.format(slotDate)} WIB`;
              const isEditing = editingId === slot.id;
              return (
                <li
                  key={slot.id}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClassName}>Tanggal</label>
                          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={`mt-1 ${fieldClassName}`} />
                        </div>
                        <div>
                          <label className={labelClassName}>Jam (WIB)</label>
                          <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className={`mt-1 ${fieldClassName}`} />
                        </div>
                        <div>
                          <label className={labelClassName}>Durasi (menit)</label>
                          <input type="number" min={1} step={1} value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className={`mt-1 ${fieldClassName}`} />
                        </div>
                        <div>
                          <label className={labelClassName}>Harga (IDR)</label>
                          <input type="number" min={0} step={1000} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={`mt-1 ${fieldClassName}`} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" disabled={editSaving} onClick={() => handleEditSave(slot.id)} className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                          {editSaving ? "Menyimpan…" : "Simpan Perubahan"}
                        </button>
                        <button type="button" disabled={editSaving} onClick={() => setEditingId(null)} className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-relaxed">{label}</p>
                        <p className="mt-0.5 text-[11px] opacity-70">
                          {slot.duration_min} menit · Rp{idrFormatter.format(slot.price_idr)} ·{" "}
                          <span className={isAvailable ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>{slot.status}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {isAvailable ? (
                          <>
                            <button type="button" onClick={() => startEdit(slot)} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold hover:bg-muted">
                              Ubah
                            </button>
                            <button type="button" disabled={cancellingId === slot.id} onClick={() => handleCancel(slot.id)} className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50">
                              {cancellingId === slot.id ? "Membatalkan…" : "Batalkan"}
                            </button>
                          </>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold opacity-60">Terkunci</span>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
