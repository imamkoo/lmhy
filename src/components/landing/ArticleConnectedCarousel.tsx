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
  badge?: string;
  badgeTone?: "top" | "newest";
}

export interface CalendlyCarouselProps extends HTMLAttributes<HTMLDivElement> {
  items: CarouselArticleItem[];
  autoPlayInterval?: number;
  pauseOnHover?: boolean;
}

type ScreenTier = "mobile" | "tablet" | "desktop";

// Refined 3-card layout: left peek card (-1), active center card (0), right peek card (1)
const VISIBLE_OFFSETS = [-2, -1, 0, 1, 2] as const;

const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 28,
  mass: 0.8,
} as const;

export function ArticleConnectedCarousel({
  items,
  autoPlayInterval = 6500,
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
  const slotRadius = total >= 5 ? 2 : total >= 3 ? 1 : 0;

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

  // Spacious active card; narrow enough for 5 visible cards on desktop
  const activeDimensions = {
    desktop: { width: 820, height: 460 },
    tablet: { width: 720, height: 440 },
    mobile: { width: Math.min(360, viewportWidth - 32), height: 500 },
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
        "relative w-full max-w-[1360px] mx-auto flex flex-col items-center select-none outline-none py-6 px-3 sm:px-6 overflow-hidden",
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
            if (Math.abs(offset) > slotRadius) {
              return {
                x: offset < 0 ? -900 : 900,
                y: -200,
                width: 60,
                height: 200,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            if (tier === "mobile") {
              const activeW = activeDimensions.width;
              const activeH = activeDimensions.height;
              const gap = 12;
              const peekW = 40;
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
                  opacity: 0.8,
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
                  opacity: 0.8,
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
              const activeW = 720;
              const activeH = 440;
              const gap = 20;
              const sideW = 85;
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
                x: offset < 0 ? -activeW / 2 - 240 : activeW / 2 + 240,
                y: -sideH / 2,
                width: 60,
                height: 200,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            // Desktop tier (>= 1120px) — 820px active card, 5 cards visible
            const activeW = 820;
            const activeH = 460;
            const gap = 22;
            const sideW = 92;
            const sideH = 350;
            const outerGap = 14;
            const outerW = 68;
            const outerH = 210;

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
                  opacity: 0.92,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              case 1:
                return {
                  x: activeW / 2 + gap,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 0.92,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              case -2:
                return {
                  x: -activeW / 2 - gap - sideW - outerGap - outerW,
                  y: -outerH / 2,
                  width: outerW,
                  height: outerH,
                  opacity: 0.75,
                  zIndex: 2,
                  pointerEvents: "auto" as const,
                };
              case 2:
                return {
                  x: activeW / 2 + gap + sideW + outerGap,
                  y: -outerH / 2,
                  width: outerW,
                  height: outerH,
                  opacity: 0.75,
                  zIndex: 2,
                  pointerEvents: "auto" as const,
                };
              default:
                return {
                  x: offset < 0 ? -760 : 760,
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
                transformStyle: "preserve-3d",
              }}
              className={cn(
                "group/card rounded-[32px] bg-white dark:bg-[#1a1528] text-slate-800 dark:text-slate-100 border border-black/[0.06] dark:border-white/10 overflow-visible transition-all duration-300",
                isActive
                  ? "shadow-[0_24px_55px_-12px_rgba(60,49,99,0.18),0_10px_24px_-6px_rgba(60,49,99,0.08)] ring-1 ring-black/5 dark:ring-white/10"
                  : "cursor-pointer shadow-[0_10px_25px_-8px_rgba(60,49,99,0.10)] hover:border-purple-300"
              )}
            >
              {/* 3D Ambient Glow Halo on Active Card */}
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-[36px] bg-gradient-to-tr from-[hsl(257,68%,73%)]/25 via-[hsl(344,81%,87%)]/15 to-[hsl(42,73%,74%)]/20 blur-xl pointer-events-none -z-10 opacity-75"
                />
              )}

              {/* Left tab connector curve SVG (attached to card -1) */}
              {offset === -1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1a1528] pointer-events-none z-[100]"
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
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1a1528] pointer-events-none z-[100]"
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

              {/* Outer tab connectors for desktop (attached to cards -2 and 2) */}
              {offset === -2 && tier === "desktop" && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1a1528] pointer-events-none z-[100]"
                  style={{
                    width: 16,
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
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-[#1a1528] pointer-events-none z-[100]"
                  style={{
                    width: 16,
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
                className="size-full overflow-hidden relative rounded-[32px]"
                style={{ borderRadius: "inherit" }}
              >
                {/* INACTIVE THUMBNAIL */}
                <motion.div
                  initial={false}
                  animate={{ opacity: isActive ? 0 : 1 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-0 p-1.5",
                    isActive && "pointer-events-none"
                  )}
                >
                  <div className="size-full rounded-[24px] overflow-hidden bg-slate-200 dark:bg-slate-800 relative shadow-inner">
                    <Image
                      alt={item.author}
                      src={item.defaultImage}
                      fill
                      unoptimized
                      draggable={false}
                      style={{ objectFit: "cover" }}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
                    {item.badge && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-2 rounded-full text-[8px] font-bold uppercase tracking-[0.18em] shadow-sm ring-1 ring-black/10",
                          item.badgeTone === "top"
                            ? "bg-[hsl(42,73%,72%)] text-[#3c3163]"
                            : "bg-[hsl(257,68.1%,72.9%)] text-white"
                        )}
                        style={{ writingMode: "vertical-rl" }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* ACTIVE CARD DETAIL CONTENT - Spacious, Airy Figma Auto-Layout */}
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
                      "size-full relative flex flex-col md:flex-row overflow-hidden",
                      !isActive && "pointer-events-none"
                    )}
                  >
                    {/* Right Background Cover Image with Ethereal Gradient Fade */}
                    <div className="absolute top-0 right-0 bottom-0 w-full md:w-[48%] h-[190px] md:h-full z-0 overflow-hidden pointer-events-none">
                      <Image
                        alt={item.author}
                        src={item.selectedImage}
                        fill
                        unoptimized
                        draggable={false}
                        style={{ objectFit: "cover" }}
                        className="size-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-105"
                      />

                      {/* Ethereal Horizontal Misty Fade to Left Content */}
                      <div
                        className="absolute inset-0 hidden md:block"
                        style={{
                          background:
                            "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.98) 22%, rgba(255,255,255,0.7) 48%, rgba(255,255,255,0.05) 85%, transparent 100%)",
                        }}
                      />
                      <div
                        className="absolute inset-0 hidden dark:md:block"
                        style={{
                          background:
                            "linear-gradient(90deg, #1a1528 0%, rgba(26,21,40,0.98) 22%, rgba(26,21,40,0.7) 48%, rgba(26,21,40,0.05) 85%, transparent 100%)",
                        }}
                      />

                      {/* Mobile Gradient (Top to Bottom) */}
                      <div className="absolute inset-0 md:hidden bg-gradient-to-t from-white dark:from-[#1a1528] via-white/60 dark:via-[#1a1528]/60 to-transparent" />
                    </div>

                    {/* Left Auto-Layout Content Column (Expansive & Generously Spaced) */}
                    <div className="relative z-10 w-full md:w-[62%] lg:w-[60%] h-full p-8 sm:p-10 md:p-12 flex flex-col justify-center gap-6 sm:gap-7">
                      {/* 1. Meta row: Author profile, category pill, reading time */}
                      <div className="flex items-center gap-3.5 sm:gap-4">
                        <div className="relative size-12 rounded-full overflow-hidden shadow-sm ring-2 ring-white/90 dark:ring-white/10 shrink-0 bg-slate-200">
                          <Image
                            alt={item.author}
                            src={item.defaultImage}
                            fill
                            unoptimized
                            draggable={false}
                            style={{ objectFit: "cover" }}
                            className="size-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                              {item.author}
                            </span>
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-[#3c3163] dark:bg-purple-900/40 dark:text-purple-300 shrink-0">
                              {item.tag || "Refleksi"}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            3 mnt baca • Terverifikasi Komunitas
                          </span>
                        </div>
                      </div>

                      {/* 2. Title with generous line height and clear letter spacing */}
                      <Link href={item.href} className="group/title block">
                        <h3
                          title={item.stat}
                          className="text-xl sm:text-2xl lg:text-[27px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.38] line-clamp-2 group-hover/title:text-purple-700 dark:group-hover/title:text-purple-400 transition-colors"
                        >
                          {item.stat}
                        </h3>
                      </Link>

                      {/* 3. Reflective Quote with relaxed, breathable line-height */}
                      <p className="font-serif text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                        “{item.quote}”
                      </p>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "absolute z-20 top-8 left-8 sm:top-10 sm:left-10 md:top-12 md:left-12 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm ring-1 ring-black/5",
                          item.badgeTone === "top"
                            ? "bg-[hsl(42,73%,72%)] text-[#3c3163]"
                            : "bg-[hsl(257,68.1%,72.9%)] text-white"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Controls: Minimalist Arrows & Progress Indicators */}
      <div className="flex items-center justify-center gap-3 mt-10 sm:mt-12">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Artikel sebelumnya"
          className="size-9 rounded-full flex items-center justify-center text-[#3c3163] dark:text-purple-200 bg-white dark:bg-[#1a1528] hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shadow-sm border border-black/[0.06] dark:border-white/10 focus-visible:ring-2 focus-visible:ring-purple-400 outline-none"
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
                  "h-[7px] sm:h-[8px] rounded-[4px] overflow-hidden border-0 p-0 cursor-pointer transition-[width] duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
                  isSelected
                    ? "w-[56px] sm:w-[72px] bg-purple-200 dark:bg-purple-950"
                    : "w-[10px] sm:w-[12px] bg-purple-200/60 dark:bg-slate-800 hover:bg-purple-300"
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
          className="size-9 rounded-full flex items-center justify-center text-[#3c3163] dark:text-purple-200 bg-white dark:bg-[#1a1528] hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shadow-sm border border-black/[0.06] dark:border-white/10 focus-visible:ring-2 focus-visible:ring-purple-400 outline-none"
        >
          <span className="text-sm font-bold">→</span>
        </button>
      </div>
    </div>
  );
}
