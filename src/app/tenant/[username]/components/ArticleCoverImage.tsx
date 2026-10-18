'use client';

import { useEffect, useRef, useState } from 'react';

interface ArticleCoverImageProps {
  src: string;
  alt: string;
  objectPosition?: string;
}

type FaceDetectorLike = {
  detect: (img: HTMLImageElement) => Promise<Array<{ boundingBox: { y: number; height: number } }>>;
};

/**
 * Editorial portrait focal point:
 * In photography/editorial layouts, subjects' faces/eyes in vertical (portrait)
 * photos consistently sit around the upper third (35-42% from top).
 * 38% frames faces naturally across headshots, selfies, and half-body shots.
 */
const EDITORIAL_PORTRAIT_FOCAL = '50% 38%';

async function tryNativeFaceDetector(img: HTMLImageElement): Promise<string | null> {
  try {
    const DetectorCtor = (
      window as unknown as {
        FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike;
      }
    ).FaceDetector;
    if (!DetectorCtor) return null;
    const detector = new DetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);
    if (!faces || faces.length === 0) return null;
    const box = faces[0].boundingBox;
    const yPct = ((box.y + box.height / 2) / img.naturalHeight) * 100;
    const clamped = Math.min(50, Math.max(20, yPct));
    return `50% ${clamped.toFixed(1)}%`;
  } catch {
    return null;
  }
}

/**
 * Uniform editorial cover (fixed height, closeup crop for all orientations).
 * - Portrait photos auto-focus on the subject (38% eye-level focal or native face detector).
 * - Landscape photos remain centered.
 * - Clicking opens a lightbox modal showing the full unclipped image over a blurred backdrop.
 */
export function ArticleCoverImage({ src, alt, objectPosition }: ArticleCoverImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleLoad = () => {
    // If SSR provided an adaptive position, respect it without client reflow
    if (objectPosition) return;

    const img = imgRef.current;
    if (!img || img.naturalWidth === 0) return;
    const isPortrait = img.naturalHeight > img.naturalWidth * 0.95;
    if (!isPortrait) return;

    img.style.objectPosition = EDITORIAL_PORTRAIT_FOCAL;
    void tryNativeFaceDetector(img).then((detectedPos) => {
      if (detectedPos && imgRef.current) {
        imgRef.current.style.objectPosition = detectedPos;
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Lihat gambar penuh: ${alt}`}
        className="group relative block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          style={objectPosition ? { objectPosition } : undefined}
          className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:h-80 md:h-96"
          onError={(e) => {
            const card = (e.currentTarget as HTMLElement).closest('.mb-8');
            if (card) (card as HTMLElement).style.display = 'none';
          }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-10"
          onClick={() => setIsOpen(false)}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/80 backdrop-blur-lg"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="relative max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            ref={closeRef}
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup gambar"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
