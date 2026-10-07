"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { WebDesignTemplate } from "@/lib/design-templates";

interface TemplatePickerDialogProps {
  templates: WebDesignTemplate[];
  activeId: string;
  stagedId: string;
  onStage: (id: string) => void;
  onApply: () => void;
  onClose: () => void;
  renderPreview: (tmpl: WebDesignTemplate) => ReactNode;
}

export function TemplatePickerDialog({
  templates,
  activeId,
  stagedId,
  onStage,
  onApply,
  onClose,
  renderPreview,
}: TemplatePickerDialogProps) {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches
  );

  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselInitialized = useRef(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  useLayoutEffect(() => {
    if (!isMobile || carouselInitialized.current) return;
    const el = carouselRef.current;
    if (!el) return;
    carouselInitialized.current = true;
    const idx = templates.findIndex((t) => t.id === stagedId);
    const slide = el.children[idx] as HTMLElement | undefined;
    if (slide) {
      el.scrollLeft = slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2;
    }
  }, [isMobile, stagedId, templates]);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let bestIndex = 0;
    let bestDistance = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const slide = child as HTMLElement;
      const distance = Math.abs(
        slide.offsetLeft + slide.offsetWidth / 2 - mid
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    });
    const tmpl = templates[bestIndex];
    if (tmpl && tmpl.id !== stagedId) onStage(tmpl.id);
  };

  const staged = templates.find((t) => t.id === stagedId) ?? templates[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pilih desain tampilan web"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-4xl h-[96vh] flex-col overflow-hidden rounded-3xl border-4 border-[#3F3766] bg-[#FAF8F5] shadow-[0_24px_70px_rgba(63,55,102,0.5)]"
      >
        {/* DIALOG HEADER */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-[#3F3766]/10 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-sm font-black tracking-tight text-[#3F3766] sm:text-lg">
              Pilih Desain Tampilan Web
            </h2>
            <p className="text-[10px] leading-relaxed text-[#3F3766]/70 sm:text-[11px]">
              Telusuri tema, lihat pratinjau langsung, lalu tekan Mulai
              Menulis. Bisa diganti kapan saja.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemilihan tema"
            className="shrink-0 rounded-lg p-2 text-xs font-bold text-[#3F3766]/50 transition hover:bg-white hover:text-[#3F3766]"
          >
            ✕
          </button>
        </div>

        {/* BODY: PREVIEW STAGE (MOBILE CAROUSEL) + ROSTER (DESKTOP) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row sm:gap-5 sm:p-4">
          {/* LIVE PREVIEW STAGE */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 sm:w-[54%] sm:max-w-[54%]">
            <div
              className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border-2 bg-white transition-all duration-300"
              style={{
                borderColor: staged.accentColor,
                boxShadow: `0 0 0 3px ${staged.accentColor}44, 0 0 28px ${staged.accentColor}55`,
              }}
            >
              {isMobile ? (
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  tabIndex={0}
                  role="group"
                  aria-label={`Pratinjau tema — geser untuk memilih. Tema saat ini: ${staged.name}`}
                  className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-contain"
                >
                  {templates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="w-[86%] shrink-0 snap-center overflow-y-auto overscroll-y-contain p-3"
                    >
                      <div className="pointer-events-none select-none">
                        {renderPreview(tmpl)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full overflow-y-auto overscroll-contain p-3">
                  <div className="pointer-events-none select-none">
                    {renderPreview(staged)}
                  </div>
                </div>
              )}

              {/* ARCADE NAME PLATE */}
              <div className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-[#3F3766] bg-white/95 px-3 py-1 shadow-[0_3px_0_0_#3F3766]">
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                  style={{ backgroundColor: staged.accentColor }}
                />
                <span className="max-w-[46vw] truncate text-[11px] font-black text-[#3F3766] sm:max-w-none">
                  {staged.name}
                </span>
              </div>
            </div>

            {/* MOBILE: CAROUSEL POSITION DOTS + HOW-TO HINT */}
            <div className="flex shrink-0 flex-col items-center gap-1.5 sm:hidden">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {templates.map((tmpl) => (
                  <span
                    key={tmpl.id}
                    className={`h-1.5 rounded-full border transition-all ${
                      tmpl.id === stagedId
                        ? "w-5 border-[#3F3766]/30"
                        : "w-1.5 border-transparent bg-[#3F3766]/25"
                    }`}
                    style={
                      tmpl.id === stagedId
                        ? { backgroundColor: staged.accentColor }
                        : undefined
                    }
                  />
                ))}
              </div>
              <p className="text-center text-[10px] leading-relaxed text-[#3F3766]/60">
                Geser pratinjau ke samping untuk ganti tema — tekan{" "}
                <span className="font-black text-[#3F3766]">
                  Mulai Menulis
                </span>{" "}
                saat sudah cocok
              </p>
            </div>

            <p className="hidden text-center text-[10px] text-[#3F3766]/50 sm:block">
              Pratinjau langsung dengan tema terpilih — gulir untuk melihat seluruh artikel
            </p>
          </div>

          {/* CHARACTER ROSTER (DESKTOP ONLY) */}
          <div className="hidden min-h-0 shrink-0 sm:block sm:flex-1 sm:overflow-y-auto">
            <div className="grid grid-cols-2 gap-3.5">
              {templates.map((tmpl) => {
                const isStaged = tmpl.id === stagedId;
                const isActive = tmpl.id === activeId;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    aria-pressed={isStaged}
                    aria-label={`Pilih tema ${tmpl.name}`}
                    onClick={() => onStage(tmpl.id)}
                    className={`flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                      isStaged
                        ? "border-[#3F3766] bg-white"
                        : "border-[#3F3766]/15 bg-white/70 hover:border-[#3F3766]/40 hover:bg-white"
                    }`}
                    style={
                      isStaged
                        ? {
                            boxShadow: `0 4px 0 0 #3F3766, 0 0 0 3px ${tmpl.accentColor}`,
                            transform: "translateY(-2px)",
                          }
                        : undefined
                    }
                  >
                    <span className="flex items-start justify-between gap-2 text-xs font-black leading-snug text-[#3F3766]">
                      <span className="min-w-0 break-words">{tmpl.name}</span>
                      <span
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
                        style={{ backgroundColor: tmpl.accentColor }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-[#3F3766]/70">
                      {tmpl.tagline}
                    </span>
                    <span className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <span className="rounded bg-[#3F3766]/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#3F3766]/60">
                        {tmpl.badge}
                      </span>
                      <span
                        className={`text-[10px] font-black ${
                          isStaged
                            ? "text-[#3F3766]"
                            : isActive
                              ? "text-[#3F3766]/60"
                              : "text-[#3F3766]/40"
                        }`}
                      >
                        {isStaged ? (isActive ? "✓ Aktif" : "Dipilih ✓") : isActive ? "Aktif" : "Pilih →"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex shrink-0 gap-2 border-t-2 border-[#3F3766]/10 bg-white px-4 py-3 sm:justify-end sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-[#3F3766]/25 bg-white px-4 py-2.5 text-xs font-bold text-[#3F3766]/80 transition hover:bg-[#F5E7C6]/40 sm:flex-none"
          >
            Lewati
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-xl border-2 border-[#3F3766] bg-[#F7ABC5] px-5 py-2.5 text-xs font-black text-[#3F3766] shadow-[0_4px_0_0_#3F3766] transition hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#3F3766] active:translate-y-[3px] sm:flex-none"
          >
            Mulai Menulis →
          </button>
        </div>
      </div>
    </div>
  );
}
