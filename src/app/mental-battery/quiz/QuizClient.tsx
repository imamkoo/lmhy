"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Answers = Record<string, number[]>;

export default function QuizClient({ instruments, totalQuestions }: { instruments: any[], totalQuestions: number }) {
  const router = useRouter();

  // State — answers per instrument
  const [answers, setAnswers] = useState<Answers>(() => {
    const init: Answers = {};
    for (const section of instruments) {
      init[section.instrumentId] = new Array(section.questions.length).fill(-1);
    }
    return init;
  });

  // Current position
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const section = instruments[sectionIdx];
  const question = section.questions[questionIdx];
  const currentAnswer = answers[section.instrumentId][questionIdx];

  // Global progress
  let globalIndex = 0;
  for (let s = 0; s < sectionIdx; s++) {
    globalIndex += instruments[s].questions.length;
  }
  globalIndex += questionIdx;
  const progress = ((globalIndex + 1) / totalQuestions) * 100;

  // Check if all answered
  const allAnswered = Object.values(answers).every((arr) =>
    arr.every((a) => a >= 0)
  );
  const isLastQuestion =
    sectionIdx === instruments.length - 1 &&
    questionIdx === section.questions.length - 1;

  function setAnswer(value: number) {
    setAnswers((prev) => {
      const copy = { ...prev };
      copy[section.instrumentId] = [...copy[section.instrumentId]];
      copy[section.instrumentId][questionIdx] = value;
      return copy;
    });
  }

  function goNext() {
    if (questionIdx < section.questions.length - 1) {
      setQuestionIdx((i) => i + 1);
    } else if (sectionIdx < instruments.length - 1) {
      setSectionIdx((i) => i + 1);
      setQuestionIdx(0);
    }
  }

  function goPrev() {
    if (questionIdx > 0) {
      setQuestionIdx((i) => i - 1);
    } else if (sectionIdx > 0) {
      const prevSection = instruments[sectionIdx - 1];
      setSectionIdx((i) => i - 1);
      setQuestionIdx(prevSection.questions.length - 1);
    }
  }

  async function handleSubmit() {
    if (!allAnswered) {
      setError("Harap jawab semua pertanyaan sebelum melanjutkan.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/mental-battery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phq9: answers["phq-9"],
          gad7: answers["gad-7"],
          dass21: answers["dass-21"],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan.");
      }

      const data = await res.json();
      // Redirect to Teaser / Lead Form instead of full result
      router.push(`/mental-battery/claim/${data.id}?token=${data.publicToken}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FFFDF8", color: "#1E293B" }}>
      {/* Simple Header */}
      <header className="py-6 px-4 max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/LMHY.png" alt="Let Me Hear You" className="w-10 h-10" />
          <span className="font-bold text-indigo-900 tracking-tight text-lg">Let Me Hear You</span>
        </Link>
        <Link href="/mental-battery" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
          Batal
        </Link>
      </header>

      <main className="px-4 pb-20">
        <div className="mx-auto max-w-2xl space-y-6 mt-8">
          {/* Disclaimer */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            <strong>Penafian:</strong> Alat skrining ini untuk refleksi mandiri
            saja. Hasil <strong>bukan</strong> diagnosis klinis. Jika kamu dalam
            krisis, kunjungi{" "}
            <Link href="/emergency" className="underline">
              Bantuan Darurat
            </Link>
            .
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm" style={{ color: "var(--black-70)" }}>
              <span>
                {section.title} — Pertanyaan {questionIdx + 1} dari{" "}
                {section.questions.length}
              </span>
              <span>
                {globalIndex + 1} / {totalQuestions}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "var(--main-color)",
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
            <p className="text-sm font-semibold tracking-wide mb-4 text-indigo-500 leading-relaxed">
              {section.instruction}
            </p>
            <p className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
              {question.text}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {section.scaleLabels.map((label: string, value: number) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 px-5 py-4 transition-all hover:bg-indigo-50/50 ${
                    currentAnswer === value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-100"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${section.instrumentId}-${questionIdx}`}
                    checked={currentAnswer === value}
                    onChange={() => setAnswer(value)}
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                  <span className={`font-medium ${currentAnswer === value ? "text-indigo-900" : "text-slate-700"}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              disabled={sectionIdx === 0 && questionIdx === 0}
              onClick={goPrev}
              className="px-6 py-3 font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
            >
              ← Sebelumnya
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                disabled={!allAnswered || submitting}
                onClick={handleSubmit}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
              >
                {submitting ? "Menganalisis..." : "Lihat Hasil Mental Battery"}
              </button>
            ) : (
              <button
                type="button"
                disabled={currentAnswer < 0}
                onClick={goNext}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
              >
                Berikutnya →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
