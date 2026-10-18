'use client';

interface ArticleCoverImageProps {
  src: string;
  alt: string;
}

/**
 * Editorial Hero Cover: Always fills container width in a refined 16:10 editorial ratio,
 * using object-top alignment so faces and main subjects remain clearly framed.
 */
export function ArticleCoverImage({ src, alt }: ArticleCoverImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full aspect-[16/10] object-cover object-top transition-transform duration-500 hover:scale-[1.01]"
      onError={(e) => {
        const parent = (e.currentTarget as HTMLElement).closest('.mb-8');
        if (parent) (parent as HTMLElement).style.display = 'none';
      }}
    />
  );
}
