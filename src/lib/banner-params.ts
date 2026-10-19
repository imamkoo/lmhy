export interface BannerParams {
  fit: "cover" | "contain";
  y: number; // 0 to 100 vertical focal point (default 50)
}

/**
 * Parse display parameters from banner URL hash fragment (backward compatible with legacy #fit=contain).
 */
export function parseBannerParams(url?: string | null): BannerParams {
  if (!url) return { fit: "cover", y: 50 };
  const hash = url.includes("#") ? url.split("#")[1] : "";
  const params = new URLSearchParams(hash);
  const isContain = url.includes("fit=contain") || params.get("fit") === "contain";
  const rawY = params.get("y") || params.get("pos");
  let y = 50;
  if (rawY !== null) {
    const parsed = parseInt(rawY, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      y = parsed;
    }
  }
  return {
    fit: isContain ? "contain" : "cover",
    y,
  };
}

/**
 * Format banner URL with hash parameters for fit and vertical focal point.
 */
export function formatBannerUrl(
  url: string,
  fit: "cover" | "contain",
  y: number = 50
): string {
  const clean = url.trim().split("#")[0].trim();
  if (!clean) return "";
  const parts: string[] = [];
  if (fit === "contain") {
    parts.push("fit=contain");
  }
  if (fit === "cover" && y !== 50) {
    parts.push(`y=${Math.round(Math.max(0, Math.min(100, y)))}`);
  }
  return parts.length > 0 ? `${clean}#${parts.join("&")}` : clean;
}
