"use client";

import { useEffect, useRef, useState } from "react";
import { applyAdaptiveFocal } from "@/lib/editorial-focal";

interface ArticleThumbnailImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  eager?: boolean;
}

/**
 * Article image with adaptive editorial framing.
 * - Portrait photos auto-focus on the subject (38% eye-level focal or native face detector).
 * - Landscape photos stay centered.
 * - Broken sources fall back to `fallbackSrc` when provided, otherwise the frame is hidden.
 */
export function ArticleThumbnailImage({
  src,
  alt,
  className = "h-full w-full object-cover transition duration-300 group-hover:scale-105",
  fallbackSrc,
  eager = false,
}: ArticleThumbnailImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [trackedSrc, setTrackedSrc] = useState(src);

  if (trackedSrc !== src) {
    setTrackedSrc(src);
    setCurrentSrc(src);
  }

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      applyAdaptiveFocal(el);
    }
  }, [currentSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      className={className}
      onLoad={() => applyAdaptiveFocal(imgRef.current)}
      onError={(e) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }
        const parent = (e.currentTarget as HTMLElement).parentElement;
        if (parent) parent.style.display = "none";
      }}
    />
  );
}
