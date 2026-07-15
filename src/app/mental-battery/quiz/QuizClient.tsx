"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Answers = Record<string, number[]>;

interface InstrumentSection {
  instrumentId: string;
  title: string;
  instruction: string;
  scaleLabels: string[];
  questions: { id: string; text: string; subscale?: string }[];
}

export default function QuizClient({ instruments, totalQuestions }: { instruments: InstrumentSection[], totalQuestions: number }) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("mentalBatteryProgress");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.answers && Object.keys(parsed.answers).length > 0) {
            return parsed.answers;
          }
        }
      }
    } catch {
      // ignore
    }

    const init: Answers = {};
    for (const section of instruments) {
      init[section.instrumentId] = new Array(section.questions.length).fill(-1);
    }
    return init;
  });

  const [sectionIdx, setSectionIdx] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("mentalBatteryProgress");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.sectionIdx === "number") return parsed.sectionIdx;
        }
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const [questionIdx, setQuestionIdx] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("mentalBatteryProgress");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.questionIdx === "number") return parsed.questionIdx;
        }
      }
    } catch {
      // ignore
    }
    return 0;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved progress is handled in initial state
  
  // Save progress
  useEffect(() => {
    try {
      sessionStorage.setItem("mentalBatteryProgress", JSON.stringify({
        answers,
        sectionIdx,
        questionIdx
      }));
    } catch {
      console.warn("Failed to save progress to sessionStorage");
    }
  }, [answers, sectionIdx, questionIdx]);

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

  const allAnswered = Object.values(answers).every((arr) =>
    arr.every((a) => a >= 0)
  );
  
  const isLastQuestion =
    sectionIdx === instruments.length - 1 &&
    questionIdx === section.questions.length - 1;

  function setAnswer(value: number) {
    if (isAnimating) return;
    
    setAnswers((prev) => {
      const copy = { ...prev };
      copy[section.instrumentId] = [...copy[section.instrumentId]];
      copy[section.instrumentId][questionIdx] = value;
      return copy;
    });

    // Auto-advance
    if (!isLastQuestion) {
      setTimeout(() => {
        goNext();
      }, 350); // Small delay for UX so user sees the radio button get checked
    }
  }

  function triggerAnimation(dir: "next" | "prev", callback: () => void) {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // In a real app we'd use Framer Motion, but here we use simple CSS
    if (containerRef.current) {
      containerRef.current.style.opacity = "0";
      containerRef.current.style.transform = dir === "next" ? "translateX(-20px)" : "translateX(20px)";
    }
    
    setTimeout(() => {
      callback();
      if (containerRef.current) {
        // Reset transform to the other side before fading in
        containerRef.current.style.transform = dir === "next" ? "translateX(20px)" : "translateX(-20px)";
        
        // Force reflow
        void containerRef.current.offsetWidth;
        
        containerRef.current.style.opacity = "1";
        containerRef.current.style.transform = "translateX(0)";
      }
      setTimeout(() => setIsAnimating(false), 200);
    }, 200);
  }

  function goNext() {
    if (currentAnswer < 0) return; // Guard
    
    triggerAnimation("next", () => {
      if (questionIdx < section.questions.length - 1) {
        setQuestionIdx((i: number) => i + 1);
      } else if (sectionIdx < instruments.length - 1) {
        setSectionIdx((i: number) => i + 1);
        setQuestionIdx(0);
      }
    });
  }

  function goPrev() {
    triggerAnimation("prev", () => {
      if (questionIdx > 0) {
        setQuestionIdx((i: number) => i - 1);
      } else if (sectionIdx > 0) {
        const prevSection = instruments[sectionIdx - 1];
        setSectionIdx((i: number) => i - 1);
        setQuestionIdx(prevSection.questions.length - 1);
      }
    });
  }

  async function handleSubmit() {
    if (!allAnswered) {
      setError("Harap jawab semua pertanyaan sebelum melanjutkan.");
      return;
    }

    if (!window.confirm("Apakah kamu yakin sudah menjawab semua dengan jujur sesuai kondisimu akhir-akhir ini?")) {
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
      sessionStorage.removeItem("mentalBatteryProgress"); // Clean up
      
      // Ke claim page dulu (karena lead capture tetap wajib)
      router.push(`/mental-battery/claim/${data.id}?token=${data.publicToken}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi."
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="px-4 pb-20 pt-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Section Indicators */}
        <div className="flex gap-2 mb-8">
          {instruments.map((inst, idx) => {
            const isCurrent = idx === sectionIdx;
            const isPast = idx < sectionIdx;
            return (
              <div key={inst.instrumentId} className="flex-1">
                <div className="text-xs font-semibold mb-1.5 px-1 truncate flex justify-between">
                  <span className={isCurrent ? "text-indigo-600" : isPast ? "text-slate-600" : "text-slate-400"}>
                    {inst.title.split("—")[1]?.trim() || inst.title}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isPast ? 'bg-indigo-400' : isCurrent ? 'bg-indigo-600' : 'bg-transparent'}`}
                    style={{ width: isPast ? '100%' : isCurrent ? `${((questionIdx + 1) / inst.questions.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Question Counter */}
        <div className="flex justify-between items-center text-sm text-slate-500 font-medium">
          <span>Pertanyaan {globalIndex + 1} dari {totalQuestions}</span>
          <span className="bg-white px-2.5 py-1 rounded-md shadow-sm border border-slate-100">{Math.round(progress)}% Selesai</span>
        </div>

        {/* Question Card with Animation Container */}
        <div 
          ref={containerRef}
          className="transition-all duration-200 ease-in-out transform"
          style={{ opacity: 1, transform: "translateX(0)" }}
        >
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="mb-6">
              <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                {section.title.split("—")[0]?.trim()}
              </span>
              <p className="text-sm font-medium tracking-wide mb-3 text-slate-500 leading-relaxed">
                {section.instruction}
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-snug">
                &ldquo;{question.text}&rdquo;
              </h2>
            </div>

            <div className="mt-10 flex flex-col gap-3.5">
              {section.scaleLabels.map((label: string, value: number) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-all duration-200 ${
                    currentAnswer === value
                      ? "border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100/50 transform scale-[1.01]"
                      : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    currentAnswer === value ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                  }`}>
                    {currentAnswer === value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name={`q-${section.instrumentId}-${questionIdx}`}
                    checked={currentAnswer === value}
                    onChange={() => setAnswer(value)}
                    className="hidden"
                  />
                  <span className={`font-semibold text-lg ${currentAnswer === value ? "text-indigo-900" : "text-slate-700"}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex gap-4 pt-4 items-center">
          <button
            type="button"
            disabled={sectionIdx === 0 && questionIdx === 0}
            onClick={goPrev}
            className="px-6 py-4 font-bold rounded-2xl text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-800 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
          >
            ← Kembali
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
              className="flex-1 bg-indigo-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menganalisis...
                </>
              ) : "Selesai & Lihat Hasil"}
            </button>
          ) : (
            <button
              type="button"
              disabled={currentAnswer < 0}
              onClick={goNext}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            >
              Selanjutnya →
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
