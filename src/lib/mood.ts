export function moodEmoji(score: number): string {
  if (score <= 20) return "😢";
  if (score <= 40) return "😔";
  if (score <= 60) return "😐";
  if (score <= 80) return "🙂";
  return "😊";
}

export function moodLabel(score: number): string {
  if (score <= 20) return "Sangat rendah";
  if (score <= 40) return "Rendah";
  if (score <= 60) return "Netral";
  if (score <= 80) return "Baik";
  return "Sangat baik";
}

export function moodGradient(score: number): string {
  if (score <= 25) return "from-[#3c3163] via-[#9b8fd4] to-[#3c3163]";
  if (score <= 50) return "from-[#b8a9e8] via-[#e8dfc4] to-[#c9b8e8]";
  if (score <= 75) return "from-[#c9b8e8] via-[#f0e6b8] to-[#d4c4f0]";
  return "from-[#f5e6a8] via-[#f0c89a] to-[#e8b4c8]";
}
