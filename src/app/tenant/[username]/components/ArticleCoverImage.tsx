'use client';

interface ArticleCoverImageProps {
  src: string;
  alt: string;
}

export function ArticleCoverImage({ src, alt }: ArticleCoverImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        const parent = (e.currentTarget as HTMLElement).closest(".mb-8");
        if (parent) (parent as HTMLElement).style.display = "none";
      }}
    />
  );
}
