'use client';

import { useState } from 'react';

interface ArticleCoverImageProps {
  src: string;
  alt: string;
}

/**
 * Adaptive cover that never crops portrait artwork: portrait images render at
 * their natural aspect ratio (contain, capped height), landscape/banner
 * images fill the row cleanly. Synchronous onLoad detects orientation.
 */
export function ArticleCoverImage({ src, alt }: ArticleCoverImageProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'unknown' | 'loading'>('unknown');

  return (
    <div
      className="relative flex items-center justify-center w-full overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={(e) => {
          const img = e.currentTarget;
          const { naturalWidth, naturalHeight } = img;
          if (naturalWidth > 0 && naturalHeight > naturalWidth) {
            setOrientation('portrait');
          } else {
            setOrientation('landscape');
          }
        }}
        className={
          orientation === 'portrait'
            ? 'max-h-[540px] sm:max-h-[620px] w-auto max-w-full object-contain'
            : 'aspect-[16/10] w-full object-cover'
        }
        onError={(e) => {
          const parent = (e.currentTarget as HTMLElement).closest('.mb-8');
          if (parent) (parent as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
}
