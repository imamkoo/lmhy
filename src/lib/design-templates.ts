export interface WebDesignTemplate {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  accentColor: string;
  previewClass: {
    container: string;
    header: string;
    authorAvatar: string;
    authorName: string;
    authorSub: string;
    badge: string;
    mediaCard: string;
    tag: string;
    title: string;
    excerpt: string;
    content: string;
    literaCard: string;
  };
}

export const DEFAULT_TEMPLATE_ID = "warm-sanctuary";

export const DESIGN_TEMPLATES: WebDesignTemplate[] = [
  {
    id: "warm-sanctuary",
    name: "Warm Sanctuary",
    tagline: "Desain kanonik Let Me Hear You dengan nuansa lembut dan hangat.",
    badge: "Official LMHY",
    accentColor: "#F7ABC5",
    previewClass: {
      container:
        "bg-gradient-to-b from-[#F5E7C6]/20 via-white to-white text-[#3F3766]",
      header: "border-b border-[#3F3766]/10 pb-4",
      authorAvatar:
        "bg-[#F7ABC5] text-[#3F3766] border border-[#3F3766]/20 shadow-sm",
      authorName: "text-[#3F3766] font-black",
      authorSub: "text-[#3F3766]/60",
      badge:
        "rounded-full bg-[#3F3766] px-2.5 py-0.5 text-[9px] font-bold text-[#F7ABC5] shadow-sm",
      mediaCard:
        "rounded-2xl border-2 border-[#3F3766]/15 shadow-sm overflow-hidden",
      tag: "rounded-lg bg-[#F7ABC5]/25 px-2 py-0.5 text-[9px] font-bold text-[#3F3766] border border-[#F7ABC5]/40",
      title: "text-[#3F3766] font-black tracking-tight",
      excerpt:
        "text-[#3F3766]/80 italic border-l-2 border-[#F7ABC5] pl-3 py-0.5 font-semibold",
      content:
        "text-[#3F3766]/85 font-medium leading-relaxed whitespace-pre-wrap font-sans",
      literaCard:
        "rounded-3xl bg-[#171d2a] p-6 text-center text-white border border-white/10 shadow-xl",
    },
  },
  {
    id: "neo-brutalism",
    name: "Neo-Brutalism Editorial",
    tagline: "Garis hitam tebal, bayangan offset tegas, berani dan modern.",
    badge: "Bold & Graphic",
    accentColor: "#FFE500",
    previewClass: {
      container: "bg-[#FFFDF9] text-black border-black",
      header: "border-b-2 border-black pb-4",
      authorAvatar:
        "bg-[#FFE500] text-black border-2 border-black font-black shadow-[2px_2px_0_#000]",
      authorName: "text-black font-black uppercase tracking-wider",
      authorSub: "text-black/70 font-mono text-[10px]",
      badge:
        "rounded-none bg-[#FFE500] border-2 border-black px-2 py-0.5 text-[9px] font-black text-black shadow-[2px_2px_0_#000]",
      mediaCard:
        "rounded-none border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden bg-white",
      tag: "rounded-none bg-black text-white px-2 py-0.5 text-[9px] font-mono font-bold uppercase",
      title: "text-black font-black tracking-tight uppercase",
      excerpt:
        "text-black bg-[#FFE500]/30 border-2 border-black p-3 font-bold shadow-[3px_3px_0_#000]",
      content:
        "text-black font-medium leading-relaxed whitespace-pre-wrap font-sans",
      literaCard:
        "rounded-none bg-white text-black border-2 border-black p-6 text-center shadow-[6px_6px_0_#000]",
    },
  },
  {
    id: "glassmorphism",
    name: "Aetheric Glass",
    tagline: "Efek kaca buram halus, kilau kristal, estetik dan futuristik.",
    badge: "Frosted Glass",
    accentColor: "#93C5FD",
    previewClass: {
      container:
        "bg-gradient-to-br from-slate-100/80 via-white/60 to-blue-50/50 backdrop-blur-md text-slate-800",
      header: "border-b border-white/60 pb-4 backdrop-blur-sm",
      authorAvatar:
        "bg-white/80 text-blue-900 border border-white shadow-[0_4px_12px_rgba(147,197,253,0.3)] backdrop-blur-md",
      authorName: "text-slate-800 font-bold",
      authorSub: "text-slate-500",
      badge:
        "rounded-full bg-blue-500/15 border border-blue-400/30 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-bold text-blue-700",
      mediaCard:
        "rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md overflow-hidden bg-white/40",
      tag: "rounded-full bg-white/70 backdrop-blur-md border border-white px-2.5 py-0.5 text-[9px] font-semibold text-slate-700 shadow-sm",
      title: "text-slate-900 font-extrabold tracking-tight",
      excerpt:
        "text-slate-700 italic bg-white/60 backdrop-blur-md border-l-4 border-blue-400 pl-3 py-1.5 rounded-r-xl shadow-sm",
      content:
        "text-slate-700 font-normal leading-relaxed whitespace-pre-wrap font-sans",
      literaCard:
        "rounded-3xl bg-slate-900/90 backdrop-blur-xl text-white border border-white/20 p-6 text-center shadow-2xl",
    },
  },
  {
    id: "editorial-zen",
    name: "Editorial Zen (Classic Paper)",
    tagline: "Kertas hangat, tinta arang halus, tipografi jernih ala esai sastra.",
    badge: "Classic Paper",
    accentColor: "#C2A68C",
    previewClass: {
      container: "bg-[#FAF7F2] text-[#222222]",
      header: "border-b border-[#222222]/15 pb-4",
      authorAvatar:
        "bg-[#222222] text-[#FAF7F2] font-serif border border-[#222222]",
      authorName: "text-[#222222] font-serif font-bold tracking-wide",
      authorSub: "text-[#222222]/60 font-serif italic text-[11px]",
      badge:
        "rounded-sm border border-[#222222]/30 px-2 py-0.5 text-[9px] font-serif uppercase tracking-widest text-[#222222]",
      mediaCard:
        "rounded-lg border border-[#222222]/20 overflow-hidden shadow-sm bg-[#FAF7F2]",
      tag: "rounded-sm bg-[#222222]/5 px-2 py-0.5 text-[9px] font-serif text-[#222222]/80 border border-[#222222]/15",
      title: "text-[#1A1A1A] font-serif font-bold tracking-normal leading-tight",
      excerpt:
        "text-[#222222]/85 font-serif italic border-l-2 border-[#222222]/40 pl-3 py-1 text-sm",
      content:
        "text-[#2C2C2C] font-serif leading-loose whitespace-pre-wrap text-[14px]",
      literaCard:
        "rounded-lg bg-[#222222] text-[#FAF7F2] border border-[#222222] p-6 text-center",
    },
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    tagline: "Sudut membulat lembut, bayangan clay 3D imut, hangat dan menenangkan.",
    badge: "Soft 3D Clay",
    accentColor: "#B8A9F0",
    previewClass: {
      container:
        "bg-gradient-to-br from-[#FBF7FF] via-[#F7F5FF] to-[#FFF5F7] text-[#4A3F6B]",
      header: "border-b border-[#B8A9F0]/25 pb-4",
      authorAvatar:
        "rounded-2xl bg-[#B8A9F0] text-white font-black shadow-[inset_2px_2px_4px_rgba(255,255,255,0.45),inset_-3px_-3px_6px_rgba(90,70,160,0.18),0_6px_14px_rgba(184,169,240,0.4)]",
      authorName: "text-[#3B3358] font-black",
      authorSub: "text-[#4A3F6B]/55",
      badge:
        "rounded-full bg-[#B8A9F0]/30 px-2.5 py-0.5 text-[9px] font-bold text-[#4A3F6B] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.85),inset_-1px_-1px_3px_rgba(90,70,160,0.12),0_3px_8px_rgba(120,100,190,0.15)]",
      mediaCard:
        "rounded-[28px] overflow-hidden border border-white/70 bg-white/60 shadow-[inset_0_2px_6px_rgba(255,255,255,0.7),0_14px_30px_rgba(120,100,190,0.16)]",
      tag: "rounded-full bg-white px-2.5 py-0.5 text-[9px] font-bold text-[#4A3F6B] border border-[#B8A9F0]/25 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(90,70,160,0.08),0_4px_10px_rgba(120,100,190,0.12)]",
      title: "text-[#3B3358] font-black tracking-tight",
      excerpt:
        "text-[#4A3F6B]/85 font-semibold bg-white/70 border-l-4 border-[#B8A9F0] pl-3 py-2 rounded-r-2xl shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),0_6px_14px_rgba(120,100,190,0.12)]",
      content:
        "text-[#4A4463] font-medium leading-relaxed whitespace-pre-wrap font-sans",
      literaCard:
        "rounded-[28px] bg-[#2C2545] p-6 text-center text-white border border-white/10 shadow-[inset_2px_2px_6px_rgba(255,255,255,0.08),0_18px_40px_rgba(44,37,69,0.45)]",
    },
  },
  {
    id: "midnight-serenity",
    name: "Midnight Serenity (Dark)",
    tagline: "Mode gelap obsidian dengan aksen lavender, tenang di malam hari.",
    badge: "Dark Mode",
    accentColor: "#A78BFA",
    previewClass: {
      container: "bg-[#0D1117] text-[#E6EDF3]",
      header: "border-b border-[#30363D] pb-4",
      authorAvatar:
        "bg-[#A78BFA] text-[#0D1117] font-black border border-[#A78BFA]/40 shadow-[0_0_12px_rgba(167,139,250,0.3)]",
      authorName: "text-[#F0F6FC] font-bold tracking-tight",
      authorSub: "text-[#8B949E] text-[10px]",
      badge:
        "rounded-full bg-[#A78BFA]/20 border border-[#A78BFA]/40 px-2.5 py-0.5 text-[9px] font-bold text-[#A78BFA]",
      mediaCard:
        "rounded-2xl border border-[#30363D] shadow-lg overflow-hidden bg-[#161B22]",
      tag: "rounded-lg bg-[#161B22] border border-[#30363D] px-2 py-0.5 text-[9px] font-bold text-[#A78BFA]",
      title: "text-[#F0F6FC] font-black tracking-tight",
      excerpt:
        "text-[#8B949E] italic border-l-2 border-[#A78BFA] pl-3 py-1 font-medium bg-[#161B22]/50 rounded-r-lg",
      content:
        "text-[#C9D1D9] font-normal leading-relaxed whitespace-pre-wrap font-sans",
      literaCard:
        "rounded-3xl bg-[#161B22] text-[#F0F6FC] border border-[#30363D] p-6 text-center shadow-2xl",
    },
  },
];

export function getDesignTemplate(id?: string | null): WebDesignTemplate {
  if (!id) {
    return DESIGN_TEMPLATES[0];
  }
  const found = DESIGN_TEMPLATES.find((tmpl) => tmpl.id === id);
  return found || DESIGN_TEMPLATES[0];
}
