"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { HTMLAttributes, MouseEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface CarouselArticleItem {
  id: string | number;
  stat: string;
  quote: string;
  author: string;
  role: string;
  defaultImage: string;
  selectedImage: string;
  slug: string;
  username: string;
  tag?: string;
  href: string;
}

export interface CalendlyCarouselProps extends HTMLAttributes<HTMLDivElement> {
  items: CarouselArticleItem[];
  autoPlayInterval?: number;
  pauseOnHover?: boolean;
}

type ScreenTier = "mobile" | "tablet" | "desktop";

const VISIBLE_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4] as const;

const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 28,
  mass: 0.8,
} as const;

export function ArticleConnectedCarousel({
  items,
  autoPlayInterval = 6000,
  pauseOnHover = true,
  className,
  ...props
}: CalendlyCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);

  const [page, setPage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [tier, setTier] = useState<ScreenTier>("desktop");
  const [viewportWidth, setViewportWidth] = useState<number>(1200);

  const total = items.length;
  const activeIndex = total > 0 ? ((page % total) + total) % total : 0;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setViewportWidth(width);

      if (width < 768) {
        setTier("mobile");
      } else if (width < 1120) {
        setTier("tablet");
      } else {
        setTier("desktop");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (pauseOnHover && isHovered) {
      lastTimeRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      elapsedRef.current += delta;

      if (elapsedRef.current >= autoPlayInterval) {
        elapsedRef.current = 0;
        lastTimeRef.current = null;
        setProgress(0);
        setPage((curr) => curr + 1);
        return;
      }

      setProgress(Math.min((elapsedRef.current / autoPlayInterval) * 100, 100));
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [page, pauseOnHover, isHovered, autoPlayInterval]);

  const handlePrev = useCallback(() => {
    elapsedRef.current = 0;
    lastTimeRef.current = null;
    setProgress(0);
    setPage((curr) => curr - 1);
  }, []);

  const handleNext = useCallback(() => {
    elapsedRef.current = 0;
    lastTimeRef.current = null;
    setProgress(0);
    setPage((curr) => curr + 1);
  }, []);

  const handleSelectTab = (event: MouseEvent<HTMLButtonElement>) => {
    const indexStr = event.currentTarget.dataset.index;

    if (indexStr !== undefined && total > 0) {
      const targetIdx = Number.parseInt(indexStr, 10);
      let diff = targetIdx - activeIndex;

      if (diff > total / 2) {
        diff -= total;
      } else if (diff < -total / 2) {
        diff += total;
      }

      elapsedRef.current = 0;
      lastTimeRef.current = null;
      setProgress(0);
      setPage((curr) => curr + diff);
    }
  };

  const handleSelectCard = (event: MouseEvent<HTMLDivElement>) => {
    const offsetStr = event.currentTarget.dataset.offset;

    if (offsetStr !== undefined) {
      const offset = Number.parseInt(offsetStr, 10);

      if (offset !== 0) {
        elapsedRef.current = 0;
        lastTimeRef.current = null;
        setProgress(0);
        setPage((curr) => curr + offset);
      }
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      handlePrev();
    } else if (event.key === "ArrowRight") {
      handleNext();
    }
  };

  const activeDimensions = {
    desktop: { width: 760, height: 460 },
    tablet: { width: 660, height: 450 },
    mobile: { width: Math.min(340, viewportWidth - 36), height: 500 },
  }[tier];

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Artikel dan Kisah Komunitas"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full max-w-[1240px] mx-auto flex flex-col items-center select-none outline-none py-2 px-2 sm:px-4 overflow-hidden",
        className
      )}
      {...props}
    >
      <div
        id="carousel-view-panel"
        role="tabpanel"
        aria-live="polite"
        className="relative w-full flex items-center justify-center overflow-visible"
        style={{ height: activeDimensions.height }}
      >
        {VISIBLE_OFFSETS.map((offset) => {
          const virtualIndex = page + offset;
          const itemIndex = ((virtualIndex % total) + total) % total;
          const item = items[itemIndex];
          const isActive = offset === 0;

          const getVariant = () => {
            if (tier === "mobile") {
              const activeW = activeDimensions.width;
              const activeH = activeDimensions.height;
              const gap = 12;
              const peekW = 44;
              const peekH = 420;

              if (offset === 0) {
                return {
                  x: -activeW / 2,
                  y: -activeH / 2,
                  width: activeW,
                  height: activeH,
                  opacity: 1,
                  zIndex: 10,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === -1) {
                return {
                  x: -activeW / 2 - gap - peekW,
                  y: -peekH / 2,
                  width: peekW,
                  height: peekH,
                  opacity: 0.85,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === 1) {
                return {
                  x: activeW / 2 + gap,
                  y: -peekH / 2,
                  width: peekW,
                  height: peekH,
                  opacity: 0.85,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }

              return {
                x: offset < 0 ? -activeW / 2 - 200 : activeW / 2 + 200,
                y: -peekH / 2,
                width: peekW,
                height: peekH,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            if (tier === "tablet") {
              const activeW = 660;
              const activeH = 450;
              const gap = 16;
              const sideW = 90;
              const sideH = 340;

              if (offset === 0) {
                return {
                  x: -activeW / 2,
                  y: -activeH / 2,
                  width: activeW,
                  height: activeH,
                  opacity: 1,
                  zIndex: 10,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === -1) {
                return {
                  x: -activeW / 2 - gap - sideW,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 0.9,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === 1) {
                return {
                  x: activeW / 2 + gap,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 0.9,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }

              return {
                x: offset < 0 ? -activeW / 2 - 260 : activeW / 2 + 260,
                y: -sideH / 2,
                width: 60,
                height: 200,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            // Desktop layout (>= 1120px)
            const activeW = 760;
            const activeH = 460;
            const gap = 20;
            const sideW = 105;
            const sideH = 340;
            const outerGap = 16;
            const outerW = 70;
            const outerH = 200;

            switch (offset) {
              case 0:
                return {
                  x: -activeW / 2,
                  y: -activeH / 2,
                  width: activeW,
                  height: activeH,
                  opacity: 1,
                  zIndex: 10,
                  pointerEvents: "auto" as const,
                };
              case -1:
                return {
                  x: -activeW / 2 - gap - sideW,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 0.95,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              case 1:
                return {
                  x: activeW / 2 + gap,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 0.95,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              case -2:
                return {
                  x: -activeW / 2 - gap - sideW - outerGap - outerW,
                  y: -outerH / 2,
                  width: outerW,
                  height: outerH,
                  opacity: 0.8,
                  zIndex: 2,
                  pointerEvents: "auto" as const,
                };
              case 2:
                return {
                  x: activeW / 2 + gap + sideW + outerGap,
                  y: -outerH / 2,
                  width: outerW,
                  height: outerH,
                  opacity: 0.8,
                  zIndex: 2,
                  pointerEvents: "auto" as const,
                };
              default:
                return {
                  x: offset < 0 ? -860 : 860,
                  y: -outerH / 2,
                  width: outerW,
                  height: outerH,
                  opacity: 0,
                  zIndex: 0,
                  pointerEvents: "none" as const,
                };
            }
          };

          return (
            <motion.div
              key={virtualIndex}
              data-offset={offset}
              onClick={handleSelectCard}
              initial={false}
              animate={getVariant()}
              transition={TRANSITION_SPRING}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                willChange: "transform",
              }}
              className={cn(
                "rounded-[28px] sm:rounded-[32px] bg-white dark:bg-[#1f1a30] text-slate-800 dark:text-slate-100 shadow-[0_16px_40px_rgba(60,49,99,0.12),0_4px_16px_rgba(60,49,99,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.65)] border border-[#3c3163]/10 dark:border-white/10 overflow-visible",
                !isActive && "cursor-pointer hover:border-purple-300 transition-colors"
              )}
            >
              {/* Left tab connector curve SVG (attached to card -1) */}
              {offset === -1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1f1a30] pointer-events-none z-[100]"
                  style={{
                    width: 22,
                    height: 42,
                    margin: "auto 0",
                    left: "calc(100% - 1px)",
                  }}
                >
                  <svg
                    viewBox="0 0 20 37.3338"
                    preserveAspectRatio="none"
                    className="size-full fill-current overflow-visible block"
                  >
                    <path d="M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z" />
                  </svg>
                </div>
              )}

              {/* Right tab connector curve SVG (attached to card 1) */}
              {offset === 1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1f1a30] pointer-events-none z-[100]"
                  style={{
                    width: 22,
                    height: 42,
                    margin: "auto 0",
                    right: "calc(100% - 1px)",
                  }}
                >
                  <svg
                    viewBox="0 0 20 37.3338"
                    preserveAspectRatio="none"
                    className="size-full fill-current overflow-visible block"
                  >
                    <path d="M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z" />
                  </svg>
                </div>
              )}

              {/* Outer tabs for desktop */}
              {offset === -2 && tier === "desktop" && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1f1a30] pointer-events-none z-[100]"
                  style={{
                    width: 18,
                    height: 28,
                    margin: "auto 0",
                    left: "calc(100% - 1px)",
                  }}
                >
                  <svg
                    viewBox="0 0 16 28"
                    preserveAspectRatio="none"
                    className="size-full fill-current overflow-visible block"
                  >
                    <path d="M0 0C0 0 0.993759 10.1818 8 10.1818C15.0062 10.1818 16 0 16 0V28C16 28 15.0062 17.8182 8 17.8182C0.993759 17.8182 0 28 0 28V0Z" />
                  </svg>
                </div>
              )}

              {offset === 2 && tier === "desktop" && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1f1a30] pointer-events-none z-[100]"
                  style={{
                    width: 18,
                    height: 28,
                    margin: "auto 0",
                    right: "calc(100% - 1px)",
                  }}
                >
                  <svg
                    viewBox="0 0 16 28"
                    preserveAspectRatio="none"
                    className="size-full fill-current overflow-visible block"
                  >
                    <path d="M0 0C0 0 0.993759 10.1818 8 10.1818C15.0062 10.1818 16 0 16 0V28C16 28 15.0062 17.8182 8 17.8182C0.993759 17.8182 0 28 0 28V0Z" />
                  </svg>
                </div>
              )}

              <div
                className="size-full overflow-hidden relative"
                style={{ borderRadius: "inherit" }}
              >
                {/* INACTIVE THUMBNAIL */}
                <motion.div
                  initial={false}
                  animate={{ opacity: isActive ? 0 : 1 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-0 p-1.5 sm:p-2",
                    isActive && "pointer-events-none"
                  )}
                >
                  <div className="size-full rounded-[20px] sm:rounded-[24px] overflow-hidden bg-slate-200 dark:bg-slate-800 relative shadow-inner">
                    <Image
                      alt={item.author}
                      src={item.defaultImage}
                      fill
                      unoptimized
                      draggable={false}
                      style={{ objectFit: "cover" }}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                </motion.div>

                {/* ACTIVE CARD DETAIL CONTENT */}
                <div
                  className="absolute inset-0"
                  style={{
                    width: activeDimensions.width,
                    height: activeDimensions.height,
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      x: isActive ? 0 : offset < 0 ? -600 : 600,
                    }}
                    transition={TRANSITION_SPRING}
                    className={cn(
                      "size-full flex flex-col md:flex-row p-4 sm:p-5 md:p-6 lg:p-7 gap-3 sm:gap-4 md:gap-5 justify-between",
                      !isActive && "pointer-events-none"
                    )}
                  >
                    {/* Left text column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      {/* Top badge row */}
                      <div className="flex items-center justify-between gap-2 shrink-0">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-[hsl(257,68%,73%)]/20 text-[#3c3163] dark:text-purple-300">
                          {item.tag || "Refleksi Jiwa"}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          @{item.username}
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={item.href} className="group/title block w-full text-left my-1 sm:my-2">
                        <h3
                          title={item.stat}
                          className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover/title:text-purple-700 dark:group-hover/title:text-purple-400 transition-colors"
                        >
                          {item.stat}
                        </h3>
                      </Link>

                      {/* Quote box */}
                      <div className="relative w-full min-w-0 my-1 py-2 px-3 sm:px-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/25 border-l-2 border-purple-400">
                        <p className="font-serif text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                          “{item.quote}”
                        </p>
                      </div>

                      {/* Author + CTA footer */}
                      <div className="flex min-w-0 w-full items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
                        <div className="flex flex-col items-start min-w-0 pr-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[130px] sm:max-w-[170px]">
                            {item.author}
                          </span>
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 truncate max-w-[130px]">
                            {item.role}
                          </span>
                        </div>

                        <Link
                          href={item.href}
                          className="rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#3c3163] text-white text-xs font-bold shadow-md hover:bg-[hsl(257,68%,55%)] transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <span>Baca Tulisan</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>

                    {/* Right image cover */}
                    <div className="relative shrink-0 overflow-hidden rounded-[18px] sm:rounded-[22px] bg-slate-100 dark:bg-slate-800 w-full md:w-[220px] lg:w-[260px] h-[160px] md:h-full max-h-[170px] md:max-h-none shadow-md">
                      <Image
                        alt={item.author}
                        src={item.selectedImage}
                        fill
                        unoptimized
                        draggable={false}
                        style={{ objectFit: "cover" }}
                        className="size-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Controls: Arrows & Progress Indicators */}
      <div className="flex items-center justify-center gap-3 mt-6 sm:mt-7">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Artikel sebelumnya"
          className="size-8 rounded-full flex items-center justify-center text-[#3c3163] dark:text-purple-200 bg-purple-100/70 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/70 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-purple-400 outline-none"
        >
          <span className="text-sm font-bold">←</span>
        </button>

        {/* Progress pill indicator tabs */}
        <div
          role="tablist"
          aria-label="Article slides"
          className="flex items-center gap-2"
        >
          {items.map((item, idx) => {
            const isSelected = idx === activeIndex;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-index={idx}
                id={`carousel-tab-${idx}`}
                aria-controls="carousel-view-panel"
                onClick={handleSelectTab}
                aria-selected={isSelected}
                aria-label={`Slide ${idx + 1}`}
                tabIndex={isSelected ? 0 : -1}
                className={cn(
                  "h-[8px] rounded-[4px] overflow-hidden border-0 p-0 cursor-pointer transition-[width] duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
                  isSelected
                    ? "w-[64px] sm:w-[80px] bg-purple-200 dark:bg-purple-950"
                    : "w-[12px] bg-purple-200/60 dark:bg-slate-800 hover:bg-purple-300"
                )}
              >
                {isSelected && (
                  <div
                    className="h-full rounded-[4px] bg-[#3c3163] dark:bg-[hsl(257,68%,73%)]"
                    style={{
                      transformOrigin: "0% 50%",
                      transform: `scaleX(${progress / 100})`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Artikel selanjutnya"
          className="size-8 rounded-full flex items-center justify-center text-[#3c3163] dark:text-purple-200 bg-purple-100/70 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/70 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-purple-400 outline-none"
        >
          <span className="text-sm font-bold">→</span>
        </button>
      </div>
    </div>
  );
}
