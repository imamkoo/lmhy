"use client";

import { useEffect, useState } from "react";

type Phase = "inhale" | "hold" | "exhale" | "rest";

const PHASE_MS: Record<Phase, number> = {
  inhale: 4000,
  hold: 2000,
  exhale: 4000,
  rest: 1000,
};

const PHASE_LABEL: Record<Phase, string> = {
  inhale: "Tarik napas",
  hold: "Tahan",
  exhale: "Hembuskan",
  rest: "Istirahat",
};

const ORDER: Phase[] = ["inhale", "hold", "exhale", "rest"];

export function BreathingGame() {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setPhase((p) => {
        const i = ORDER.indexOf(p);
        return ORDER[(i + 1) % ORDER.length];
      });
    }, PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, running]);

  const scale =
    phase === "inhale" ? 1.35 : phase === "hold" ? 1.35 : phase === "exhale" ? 0.75 : 0.9;

  const duration =
    phase === "inhale" || phase === "exhale" ? "4000ms" : "500ms";

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Ikuti lingkaran: tarik napas saat membesar, tahan, lalu hembuskan saat mengecil.
      </p>
      <div className="relative flex h-64 w-64 items-center justify-center">
        <div
          className="absolute rounded-full bg-teal-400/30 ease-in-out dark:border border-[var(--border-color-1)] bg-white dark:bg-slate-900/400/20"
          style={{
            width: "12rem",
            height: "12rem",
            transform: `scale(${scale})`,
            transition: `transform ${duration} ease-in-out`,
          }}
        />
        <div
          className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full lmhy-btn text-center text-white shadow-lg"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${duration} ease-in-out`,
          }}
        >
          <span className="text-lg font-semibold">{PHASE_LABEL[phase]}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setRunning((r) => !r);
          if (!running) setPhase("inhale");
        }}
        className="rounded-xl lmhy-btn px-8 py-3 font-medium text-white hover:opacity-90"
      >
        {running ? "Jeda" : "Mulai"}
      </button>
    </div>
  );
}
