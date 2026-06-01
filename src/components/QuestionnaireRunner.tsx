"use client";

import { useState } from "react";
import type { QuestionnaireDefinition } from "@/data/questionnaires/types";

type Props = {
  questionnaire: QuestionnaireDefinition;
  onComplete: (answers: number[]) => Promise<void>;
};

export function QuestionnaireRunner({ questionnaire, onComplete }: Props) {
  const [answers, setAnswers] = useState<number[]>(
    () => new Array(questionnaire.questions.length).fill(-1)
  );
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxVal = questionnaire.scaleType === "yes-no" ? 1 : 3;
  const q = questionnaire.questions[step];
  const allAnswered = answers.every((a) => a >= 0);

  function setAnswer(value: number) {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
  }

  async function submitAll() {
    if (!allAnswered) {
      setError("Harap jawab semua pertanyaan.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onComplete(answers);
      setDone(true);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--border-color-1)] border border-[var(--border-color-1)] bg-white dark:bg-slate-900/40 p-8 text-center dark:border-[var(--border-color-1)] dark:bg-teal-950/40">
        <p className="text-lg font-semibold text-[var(--color-brand)] dark:text-teal-200">
          Terima kasih
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Jawaban Anda telah disimpan. Ini <strong>bukan</strong> diagnosis klinis.
          Konsultasikan dengan tenaga profesional bila perlu.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Raw answer count: {answers.length} · Sum (informational only):{" "}
          {answers.reduce((s, v) => s + v, 0)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Penafian:</strong> Alat skrining ini untuk refleksi mandiri saja.
        Hasil tidak menegakkan diagnosis. Jika Anda dalam krisis, kunjungi halaman{" "}
        <a href="/emergency" className="underline">
          Bantuan Darurat
        </a>
        .
      </div>

      <div>
        <p className="text-sm text-slate-500">
          Pertanyaan {step + 1} dari {questionnaire.questions.length}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full lmhy-btn transition-all"
            style={{
              width: `${((step + 1) / questionnaire.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {questionnaire.title} · English
        </p>
        <p className="mt-2 text-lg font-medium">{q.text}</p>

        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: maxVal + 1 }, (_, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                answers[step] === i
                  ? "border-[var(--main-color)] border border-[var(--border-color-1)] bg-white dark:bg-slate-900/40 dark:bg-teal-950/40"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-600"
              }`}
            >
              <input
                type="radio"
                name={`q-${step}`}
                checked={answers[step] === i}
                onChange={() => setAnswer(i)}
                className="accent-[var(--main-color)]"
              />
              <span>{questionnaire.scaleLabels[i]}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="rounded-xl border border-slate-300 px-4 py-2 disabled:opacity-40 dark:border-slate-600"
        >
          Sebelumnya
        </button>
        {step < questionnaire.questions.length - 1 ? (
          <button
            type="button"
            disabled={answers[step] < 0}
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-xl lmhy-btn py-2 font-medium text-white disabled:opacity-40"
          >
            Berikutnya
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={submitAll}
            className="flex-1 rounded-xl lmhy-btn py-2 font-medium text-white disabled:opacity-40"
          >
            {submitting ? "Menyimpan…" : "Selesai & simpan"}
          </button>
        )}
      </div>
    </div>
  );
}
