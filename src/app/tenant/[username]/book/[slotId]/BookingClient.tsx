'use client';

import { useState } from "react";
import { initiateSessionBooking } from "@/app/actions/booking";
import CrisisBanner from "@/components/sanctuary/CrisisBanner";

declare global {
  interface Window {
    snap?: {
      pay: (token: string) => unknown;
    };
  }
}

interface BookingClientProps {
  slotId: string;
  providerName: string;
  startTime: string;
  durationMin: number;
  priceIdr: number;
  snapScriptUrl: string;
  clientKey: string;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

const numberFormatter = new Intl.NumberFormat("id-ID");

function loadSnapScript(src: string, clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      if (window.snap) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("snap-load")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("snap-load"));
    document.head.appendChild(script);
  });
}

export default function BookingClient({
  slotId,
  providerName,
  startTime,
  durationMin,
  priceIdr,
  snapScriptUrl,
  clientKey,
}: BookingClientProps) {
  const [pseudonym, setPseudonym] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null);

  const slotDate = new Date(startTime);
  const slotTimeLabel = Number.isNaN(slotDate.getTime())
    ? startTime
    : `${dateFormatter.format(slotDate)} · ${timeFormatter.format(slotDate)} WIB`;
  const priceLabel = `Rp${numberFormatter.format(Math.round(priceIdr))}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await initiateSessionBooking({
        slotId,
        pseudonym,
        contact,
        note: note ? note : undefined,
        consent,
      });

      if (result.ok === false && result.code === "CRISIS") {
        setCrisisMessage(result.message);
        return;
      }

      if (result.ok === false) {
        setErrorMessage(result.message);
        return;
      }

      try {
        await loadSnapScript(snapScriptUrl, clientKey);
      } catch {
        setErrorMessage(
          "Halaman pembayaran belum bisa dibuka. Silakan muat ulang halaman ini dan coba lagi.",
        );
        return;
      }

      if (!window.snap) {
        setErrorMessage(
          "Halaman pembayaran belum bisa dibuka. Silakan muat ulang halaman ini dan coba lagi.",
        );
        return;
      }

      window.snap.pay(result.token);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (crisisMessage !== null) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        {crisisMessage ? (
          <p role="alert" className="mb-4 text-sm leading-relaxed text-slate-600">
            {crisisMessage}
          </p>
        ) : null}
        <CrisisBanner />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-bold sm:text-2xl">Pesan Sesi Dengar</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Sesi terjadwal bersama {providerName} · {slotTimeLabel} · {durationMin}{" "}
        menit
      </p>
      <p className="mt-1 text-lg font-bold">{priceLabel}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="booking-pseudonym"
            className="mb-1 block text-sm font-semibold"
          >
            Nama Samaran
          </label>
          <input
            id="booking-pseudonym"
            type="text"
            value={pseudonym}
            onChange={(event) => setPseudonym(event.target.value)}
            required
            autoComplete="nickname"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-[#3F3766] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="booking-contact"
            className="mb-1 block text-sm font-semibold"
          >
            Kontak WhatsApp/Email
          </label>
          <input
            id="booking-contact"
            type="text"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            required
            autoComplete="tel"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-[#3F3766] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="booking-note" className="mb-1 block text-sm font-semibold">
            Catatan untuk pendamping
          </label>
          <textarea
            id="booking-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-[#3F3766] focus:outline-none"
          />
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input
            id="booking-consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
            className="mt-1 h-4 w-4 shrink-0"
          />
          <label htmlFor="booking-consent" className="text-xs leading-relaxed">
            Saya memahami bahwa sesi ini adalah sesi dengar terjadwal, BUKAN
            layanan darurat. Jika saya sedang dalam kondisi krisis, saya akan
            menghubungi LISA 0811-3815-472 atau Kemenkes 119 ext 8.
          </label>
        </div>

        {errorMessage ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full items-center justify-center rounded-xl bg-[#F7ABC5] px-4 py-3 text-sm font-semibold text-[#3F3766] transition hover:bg-[#F5E7C6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Memproses…" : `Lanjut ke Pembayaran · ${priceLabel}`}
        </button>
      </form>
    </div>
  );
}
