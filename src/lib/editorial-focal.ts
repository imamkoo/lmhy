/**
 * Editorial portrait focal point:
 * In photography/editorial layouts, subjects' faces/eyes in vertical (portrait)
 * photos consistently sit around the upper third (35-42% from top).
 * 38% frames faces naturally across headshots, selfies, and half-body shots.
 */
export const EDITORIAL_PORTRAIT_FOCAL = "50% 38%";

type FaceDetectorLike = {
  detect: (
    img: HTMLImageElement
  ) => Promise<Array<{ boundingBox: { y: number; height: number } }>>;
};

export async function tryNativeFaceDetector(
  img: HTMLImageElement
): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    const DetectorCtor = (
      window as unknown as {
        FaceDetector?: new (options?: {
          fastMode?: boolean;
          maxDetectedFaces?: number;
        }) => FaceDetectorLike;
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
 * Apply adaptive portrait focal point to an image element upon load.
 * Portrait photos auto-focus on 38% eye-level focal (or native face detector).
 * Landscape photos stay centered (default).
 */
export function applyAdaptiveFocal(img: HTMLImageElement | null): void {
  if (!img || img.naturalWidth === 0) return;
  const isPortrait = img.naturalHeight > img.naturalWidth * 0.95;
  if (!isPortrait) return;

  img.style.objectPosition = EDITORIAL_PORTRAIT_FOCAL;
  void tryNativeFaceDetector(img).then((detectedPos) => {
    if (detectedPos && img) {
      img.style.objectPosition = detectedPos;
    }
  });
}
