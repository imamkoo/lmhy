"use client";

import { useRef } from "react";
import { applyAdaptiveFocal } from "@/lib/editorial-focal";

interface ArticleThumbnailImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ArticleThumbnailImage({
  src,
  alt,
  className = "h-full w-full object-cover transition duration-300 group-hover:scale-105",
}: ArticleThumbnailImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onLoad={() => applyAdaptiveFocal(imgRef.current)}
      onError={(e) => {
        const parent = (e.currentTarget as HTMLElement).parentElement;
        if (parent) parent.style.display = "none";
      }}
    />
  );
}
