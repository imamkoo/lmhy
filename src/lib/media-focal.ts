import sharp from "sharp";

const FOCAL_CACHE = new Map<string, string>();
const MAX_CACHE_ENTRIES = 500;

/**
 * Computes an adaptive CSS `object-position` value for an article cover image.
 * Analyzes the top region of vertical/square images to detect where the subject's
 * head begins, ensuring faces and eyes are framed naturally inside horizontal
 * banner containers (e.g. 768x384).
 *
 * Returns a CSS object-position string like "50% 18.3%", or null if default
 * centering (landscape images) should be kept.
 */
export async function getAdaptiveCoverPosition(
  url: string | null | undefined
): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;

  const cached = FOCAL_CACHE.get(url);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    // Analyze at small resolution for sub-10ms processing speed
    const ANALYSIS_WIDTH = 80;
    const { data, info } = await sharp(buf)
      .resize(ANALYSIS_WIDTH, null, { withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;

    if (!width || !height || height < width * 0.9) {
      // Landscape: keep default center
      remember(url, null);
      return null;
    }

    const imageAspect = height / width;
    const containerAspect = 0.5; // Desktop container 768x384 = 2:1
    const excessRatio = (imageAspect - containerAspect) / imageAspect;

    // Build background model from average of top 4% rows
    const bgRows = Math.max(2, Math.round(height * 0.04));
    let br = 0;
    let bg = 0;
    let bb = 0;
    for (let y = 0; y < bgRows; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        br += data[i];
        bg += data[i + 1];
        bb += data[i + 2];
      }
    }
    const sampleCount = bgRows * width;
    br /= sampleCount;
    bg /= sampleCount;
    bb /= sampleCount;

    // Compute deviation from background and horizontal edge energy per row
    const rowDev = new Array(height).fill(0);
    const rowEnergy = new Array(height).fill(0);
    for (let y = 0; y < height; y++) {
      let dev = 0;
      let energy = 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        dev +=
          Math.abs(data[i] - br) +
          Math.abs(data[i + 1] - bg) +
          Math.abs(data[i + 2] - bb);
        if (x < width - 1) {
          const i2 = (y * width + x + 1) * channels;
          energy +=
            Math.abs(data[i2] - data[i]) +
            Math.abs(data[i2 + 1] - data[i + 1]) +
            Math.abs(data[i2 + 2] - data[i + 2]);
        }
      }
      rowDev[y] = dev / width;
      rowEnergy[y] = energy / Math.max(1, width - 1);
    }

    // Baseline energy from top 8% rows
    const baseN = Math.max(3, Math.round(height * 0.08));
    const sortedBase = rowEnergy.slice(0, baseN).sort((a, b) => a - b);
    const medE = sortedBase[Math.floor(sortedBase.length / 2)] || 1;

    // Detect head top: first row where deviation and energy jump above background
    let headTop = -1;
    const maxScanRow = Math.round(height * 0.45);
    for (let y = 2; y < maxScanRow - 1; y++) {
      if (
        rowDev[y] > 25 &&
        rowEnergy[y] > medE * 2.0 &&
        rowDev[y + 1] > 25 &&
        rowEnergy[y + 1] > medE * 2.0
      ) {
        headTop = y;
        break;
      }
    }

    let resultPosition: string;
    if (headTop >= 0 && excessRatio > 0.05) {
      const headTopRatio = headTop / height;
      const targetTopRatio = Math.max(0, headTopRatio - 0.03); // 3% headroom
      const yPct = (targetTopRatio / excessRatio) * 100;
      const clampedY = Math.min(50, Math.max(0, yPct));
      resultPosition = `50% ${clampedY.toFixed(1)}%`;
    } else {
      // Fallback: portrait defaults to 38% eye-level, square defaults to 20%
      resultPosition = height > width * 1.15 ? "50% 38%" : "50% 20%";
    }

    remember(url, resultPosition);
    return resultPosition;
  } catch {
    return null;
  }
}

function remember(url: string, value: string | null) {
  if (FOCAL_CACHE.size >= MAX_CACHE_ENTRIES) {
    const firstKey = FOCAL_CACHE.keys().next().value;
    if (firstKey !== undefined) FOCAL_CACHE.delete(firstKey);
  }
  if (value !== null) {
    FOCAL_CACHE.set(url, value);
  }
}
