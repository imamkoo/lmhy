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
  stiffness: 220,
  damping: 26,
  mass: 0.75,
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
  const activeIndex = ((page % total) + total) % total;

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

    if (indexStr !== undefined) {
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
    desktop: { width: 780, height: 490 },
    tablet: { width: 560, height: 440 },
    mobile: { width: Math.min(340, viewportWidth - 48), height: 490 },
  }[tier];

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
        "relative w-full max-w-[1240px] mx-auto flex flex-col items-center select-none outline-none py-4 overflow-hidden",
        className
      )}
      {...props}
    >
      <div
        id="carousel-view-panel"
        role="tabpanel"
        aria-live="polite"
        className="relative w-full flex items-center justify-center"
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
              const gap = 16;
              const peekW = 54;
              const peekH = 410;

              if (offset === 0) {
                return {
                  x: -activeW / 2,
                  y: -activeH / 2,
                  width: activeW,
                  height: activeH,
                  opacity: 1,
                  zIndex: 0,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === -1) {
                return {
                  x: -activeW / 2 - gap - peekW,
                  y: -peekH / 2,
                  width: peekW,
                  height: peekH,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === 1) {
                return {
                  x: activeW / 2 + gap,
                  y: -peekH / 2,
                  width: peekW,
                  height: peekH,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              }

              return {
                x: offset < 0 ? -activeW / 2 - 220 : activeW / 2 + 220,
                y: -peekH / 2,
                width: peekW,
                height: peekH,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            if (tier === "tablet") {
              const activeW = 560;
              const activeH = 440;
              const gap = 18;
              const sideW = 100;
              const sideH = 340;

              if (offset === 0) {
                return {
                  x: -activeW / 2,
                  y: -activeH / 2,
                  width: activeW,
                  height: activeH,
                  opacity: 1,
                  zIndex: 0,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === -1) {
                return {
                  x: -activeW / 2 - gap - sideW,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              }

              if (offset === 1) {
                return {
                  x: activeW / 2 + gap,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              }

              return {
                x: offset < 0 ? -activeW / 2 - 240 : activeW / 2 + 240,
                y: -sideH / 2,
                width: 74,
                height: 205,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            switch (offset) {
              case 0:
                return {
                  x: -390,
                  y: -245,
                  width: 780,
                  height: 490,
                  opacity: 1,
                  zIndex: 0,
                  pointerEvents: "auto" as const,
                };
              case -1:
                return {
                  x: -515,
                  y: -172,
                  width: 105,
                  height: 344,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              case 1:
                return {
                  x: 410,
                  y: -172,
                  width: 105,
                  height: 344,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              case -2:
                return {
                  x: -605,
                  y: -102.5,
                  width: 74,
                  height: 205,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              case 2:
                return {
                  x: 531,
                  y: -102.5,
                  width: 74,
                  height: 205,
                  opacity: 1,
                  zIndex: 100,
                  pointerEvents: "auto" as const,
                };
              case -3:
                return {
                  x: -730,
                  y: -102.5,
                  width: 74,
                  height: 205,
                  opacity: 0,
                  zIndex: 0,
                  pointerEvents: "none" as const,
                };
              case 3:
                return {
                  x: 656,
                  y: -102.5,
                  width: 74,
                  height: 205,
                  opacity: 0,
                  zIndex: 0,
                  pointerEvents: "none" as const,
                };
              default:
                return {
                  x: offset < 0 ? -870 : 870,
                  y: -102.5,
                  width: 74,
                  height: 205,
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
                "rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-[0_16px_40px_rgba(60,49,99,0.14),0_4px_16px_rgba(60,49,99,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.65)] border border-[#3c3163]/10 dark:border-white/10 overflow-visible",
                !isActive && "cursor-pointer"
              )}
            >
              {/* Left tab connector curve SVG */}
              {offset === -1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-slate-900 pointer-events-none z-[100]"
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

              {/* Right tab connector curve SVG */}
              {offset === 1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-slate-900 pointer-events-none z-[100]"
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

              {offset === -2 && tier === "desktop" && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-slate-900 pointer-events-none z-[100]"
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
                  className="absolute top-0 bottom-0 flex items-center text-white dark:text-slate-900 pointer-events-none z-[100]"
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
                    "absolute inset-0 p-2",
                    isActive && "pointer-events-none"
                  )}
                >
                  <div className="size-full rounded-[20px] sm:rounded-[24px] overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
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
                </motion.div>

                {/* ACTIVE CARD DETAIL CONTENT */}
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: activeDimensions.width,
                    height: activeDimensions.height,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      x: isActive ? 0 : offset < 0 ? -822 : 822,
                    }}
                    transition={TRANSITION_SPRING}
                    className={cn(
                      "size-full flex flex-col md:flex-row p-5 sm:p-6 md:p-7 gap-4 md:gap-6",
                      !isActive && "pointer-events-none"
                    )}
                  >
                    {/* Left text column */}
                    <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left justify-between py-1 gap-3">
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-[hsl(257,68%,73%)]/25 text-[#3c3163] dark:text-purple-300">
                          {item.tag || "Refleksi Jiwa"}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          @{item.username}
                        </span>
                      </div>

                      <Link href={item.href} className="group/title block w-full text-left">
                        <h3
                          title={item.stat}
                          className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight w-full line-clamp-2 group-hover/title:text-purple-700 dark:group-hover/title:text-purple-400 transition-colors"
                        >
                          {item.stat}
                        </h3>
                      </Link>

                      <div className="relative w-full min-w-0 my-auto py-1">
                        <span
                          aria-hidden="true"
                          className="font-serif text-3xl text-purple-300 dark:text-purple-600 absolute right-full top-0 pr-1 select-none pointer-events-none hidden md:inline"
                        >
                          “
                        </span>
                        <p className="font-serif text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                          “{item.quote}”
                        </p>
                      </div>

                      <div className="flex min-w-0 w-full items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex flex-col items-start min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {item.author}
                          </span>
                          <span className="text-[11px] text-purple-600 dark:text-purple-400">
                            {item.role}
                          </span>
                        </div>

                        <Link
                          href={item.href}
                          className="rounded-full px-4 py-2 bg-[#3c3163] text-white text-xs font-bold shadow-md hover:bg-[hsl(257,68%,55%)] transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <span>Baca Tulisan</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>

                    {/* Right image cover */}
                    <div className="relative shrink-0 overflow-hidden rounded-[20px] bg-slate-100 w-full md:w-[clamp(200px,46%,340px)] flex-1 md:flex-initial md:h-full max-h-[220px] md:max-h-none shadow-md">
                      <Image
                        alt={item.author}
                        src={item.selectedImage}
                        fill
                        unoptimized
                        draggable={false}
                        style={{ objectFit: "cover" }}
                        className="size-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress pill indicator tabs */}
      <div
        role="tablist"
        aria-label="Article slides"
        className="flex items-center gap-2 mt-6"
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
                  ? "w-[80px] bg-purple-200 dark:bg-purple-950"
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
    </div>
  );
}
