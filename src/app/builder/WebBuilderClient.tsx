"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { REFLECTION_TEMPLATES, ReflectionTemplate } from "@/lib/builder-templates";
import {
  DESIGN_TEMPLATES,
  getDesignTemplate,
  DEFAULT_TEMPLATE_ID,
  WebDesignTemplate,
} from "@/lib/design-templates";
import { publishTenantArticle } from "@/app/actions/tenant";
import { LiteraLoginModal } from "@/components/litera/LiteraLoginModal";
import { TemplatePickerDialog } from "@/app/builder/TemplatePickerDialog";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/actions/auth";

const STORAGE_KEY = "lmhy_builder_draft_v3";

export function WebBuilderClient({
  initialUsername,
  initialUser,
  initialProfile,
}: {
  initialUsername?: string;
  initialUser?: { id: string; email?: string } | null;
  initialProfile?: { username: string; display_name: string } | null;
}) {
  // 0. Auth & Session State
  const [authLoading, setAuthLoading] = useState(!initialUser);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(initialUser || null);
  const [authProfile, setAuthProfile] = useState<{ username: string; display_name: string } | null>(initialProfile || null);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [showConfirmPublishModal, setShowConfirmPublishModal] = useState(false);
  const [publishedData, setPublishedData] = useState<{ url: string; slug: string; title: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Subdomain State & Lock Management
  const defaultUser = initialProfile?.username || initialUsername || "";
  const [username, setUsername] = useState(defaultUser);
  const [tempUsername, setTempUsername] = useState(defaultUser);
  const [isSubdomainConfirmed, setIsSubdomainConfirmed] = useState(Boolean(defaultUser.trim()));
  const [subdomainModalError, setSubdomainModalError] = useState<string | null>(null);
  const [isEditingUsernameInStudio, setIsEditingUsernameInStudio] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // 2. Template & Article Content State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [stagedTemplateId, setStagedTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  // 3. Preview Device & Mobile View Tabs ("editor" vs "preview")
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [mobileActiveTab, setMobileActiveTab] = useState<"editor" | "preview">("editor");

  // 4. Litera Web3 State (Unified & Hardened)
  const [registerLitera, setRegisterLitera] = useState(true);
  const [creatorWallet, setCreatorWallet] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<string>("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const [unlockableUrl, setUnlockableUrl] = useState<string>("");

  // Quiz State (Proof of Reading)
  const [enableQuiz, setEnableQuiz] = useState<boolean>(false);
  const [quizQuestion, setQuizQuestion] = useState<string>("");
  const [quizOptions, setQuizOptions] = useState<string[]>(["", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);

  // Media Asset State (Gambar / Video Switcher)
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [mediaPreview, setMediaPreview] = useState<string>("/assets/sapiens.png");
  const [mediaFileName, setMediaFileName] = useState<string>("");
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // 5. System & UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const isHydratedRef = useRef(false);

  const [activeBaseDomain] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return "letmehearyou.id";
    }
    return "letmehearyou.id";
  });

  // Format username helper
  const formatUsername = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 32);
  };

  // Check Supabase session on mount & subscribe to auth state changes
  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthUser(user);
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.username) {
            setAuthProfile(profile);
            setUsername(profile.username);
            setTempUsername(profile.username);
            setIsSubdomainConfirmed(true);
          }
        } else if (!initialUser) {
          setAuthUser(null);
        }
      } catch (err) {
        console.warn("Error checking auth status:", err);
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        setAuthLoading(false);
      } else if (event === "SIGNED_OUT") {
        setAuthUser(null);
        setAuthProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser]);

  // 6. Local Storage Persistence (Restore on Mount)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      try {
        const rawDraft = localStorage.getItem(STORAGE_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d.username && !initialUsername) {
            setUsername(d.username);
            setTempUsername(d.username);
            setIsSubdomainConfirmed(true);
          }
          if (d.title !== undefined) setTitle(d.title);
          if (d.excerpt !== undefined) setExcerpt(d.excerpt);
          if (d.content !== undefined) setContent(d.content);
          if (d.tags !== undefined) setTags(d.tags);
          if (d.selectedTemplateId !== undefined) setSelectedTemplateId(d.selectedTemplateId);
          if (d.registerLitera !== undefined) setRegisterLitera(d.registerLitera);
          if (d.creatorWallet) setCreatorWallet(d.creatorWallet);
          if (d.loginMethod) setLoginMethod(d.loginMethod);
          if (d.selectedCollection !== undefined) setSelectedCollection(d.selectedCollection);
          if (d.newCollectionName !== undefined) setNewCollectionName(d.newCollectionName);
          if (d.unlockableUrl !== undefined) setUnlockableUrl(d.unlockableUrl);
          if (d.enableQuiz !== undefined) setEnableQuiz(d.enableQuiz);
          if (d.quizQuestion !== undefined) setQuizQuestion(d.quizQuestion);
          if (d.quizOptions !== undefined) setQuizOptions(d.quizOptions);
          if (d.correctIndex !== undefined) setCorrectIndex(d.correctIndex);
          if (d.savedAt) setLastSavedTime(d.savedAt);
        }
      } catch (e) {
        console.warn("Gagal memulihkan draf lokal:", e);
      } finally {
        isHydratedRef.current = true;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [initialUsername]);

  // 7. Auto-save to Local Storage on Change
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === "undefined") return;
    if (isPublished) return; // Do not overwrite if already published

    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const draft = {
      username,
      title,
      excerpt,
      content,
      tags,
      selectedTemplateId,
      registerLitera,
      creatorWallet,
      loginMethod,
      selectedCollection,
      newCollectionName,
      unlockableUrl,
      enableQuiz,
      quizQuestion,
      quizOptions,
      correctIndex,
      savedAt: timeStr,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("Gagal menyimpan draf otomatis:", e);
    }
  }, [
    username,
    title,
    excerpt,
    content,
    tags,
    selectedTemplateId,
    registerLitera,
    creatorWallet,
    loginMethod,
    selectedCollection,
    newCollectionName,
    unlockableUrl,
    enableQuiz,
    quizQuestion,
    quizOptions,
    correctIndex,
    isPublished,
  ]);

  // Handle Subdomain Confirmation from Initial Modal
  const handleConfirmSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = formatUsername(tempUsername);
    if (!clean || clean.length < 3) {
      setSubdomainModalError("Username subdomain minimal 3 karakter (huruf, angka, atau tanda minus).");
      return;
    }
    setUsername(clean);
    setIsSubdomainConfirmed(true);
    setSubdomainModalError(null);
  };

  // Handle Inline Studio Username Update
  const handleSaveInlineUsername = () => {
    if (isPublished) return;
    const clean = formatUsername(tempUsername);
    if (!clean || clean.length < 3) {
      setError("Username subdomain minimal 3 karakter.");
      return;
    }
    setUsername(clean);
    setIsEditingUsernameInStudio(false);
    setError(null);
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFileName(file.name);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleOpenTemplatePicker = () => {
    setStagedTemplateId(selectedTemplateId);
    setShowTemplatePicker(true);
  };

  const handleApplyStagedTemplate = () => {
    handleSelectTemplate(stagedTemplateId);
    setShowTemplatePicker(false);
  };

  const handleApplyReflectionPrompt = (template: ReflectionTemplate) => {
    if (template.id !== "blank-canvas") {
      setTitle(template.defaultTitle);
      setExcerpt(template.defaultExcerpt);
      setContent(template.content);
      setTags(template.defaultTags);
    } else {
      setTitle("");
      setExcerpt("");
      setContent("");
      setTags("Refleksi, Jurnal, Kesehatan Mental");
    }
  };

  const handleToggleLitera = (enabled: boolean) => {
    setRegisterLitera(enabled);
    if (enabled && !creatorWallet) {
      // Auto open login prompt modal
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (walletAddress: string, method: string) => {
    setCreatorWallet(walletAddress);
    setLoginMethod(method);
    setRegisterLitera(true);
    setError(null);
  };

  const cleanUser = username.trim() || "nama-domain";
  const domainPreview = `https://${cleanUser}.${activeBaseDomain}`;
  const activeTemplate: WebDesignTemplate = getDesignTemplate(selectedTemplateId);

  // Handle Form Submission with Strict Security Hardening
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      setIsSubdomainConfirmed(false);
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Judul dan isi tulisan wajib diisi.");
      setMobileActiveTab("editor");
      return;
    }

    // Security Hardening: If Litera Web3 is ON, Creator Wallet is STRICTLY REQUIRED
    if (registerLitera && !creatorWallet) {
      setError("Peringatan Keamanan: Penerbitan Web3 diaktifkan, namun akun Litera belum terhubung. Hubungkan akun Litera terlebih dahulu agar sertifikat NFT terbit atas nama dompet Anda, atau matikan penerbitan Web3.");
      setIsLoginModalOpen(true);
      setMobileActiveTab("editor");
      return;
    }

    setError(null);
    setShowConfirmPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const finalCollection =
        selectedCollection === "__new__"
          ? newCollectionName.trim()
          : selectedCollection || "Let Me Hear You - Jurnal & Refleksi";

      const quizPayload =
        enableQuiz && quizQuestion.trim()
          ? {
              question: quizQuestion.trim(),
              options: quizOptions.map((o) => o.trim()).filter(Boolean),
              correctIndex,
            }
          : undefined;

      const res = await publishTenantArticle({
        username: cleanUser,
        title,
        excerpt,
        content,
        tags,
        templateId: selectedTemplateId,
        registerLitera,
        creatorAddress: creatorWallet || undefined,
        collectionName: finalCollection,
        unlockableUrl: unlockableUrl.trim() || undefined,
        mediaType,
        mediaUrl: mediaPreview,
        quiz: quizPayload,
      });

      if (!res.success) {
        setError(res.error || "Gagal menerbitkan artikel.");
        setIsSubmitting(false);
        return;
      }

      // Lock username upon successful publishing
      setIsPublished(true);
      setShowConfirmPublishModal(false);

      // Clean local draft storage
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }

      const targetUrl = `https://${cleanUser}.${activeBaseDomain}/${res.slug}`;
      setPublishedData({
        url: targetUrl,
        slug: res.slug || "",
        title: title || "Refleksi Baru",
      });
      setShowPublishSuccessModal(true);
      setIsSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mempublikasikan.");
      setIsSubmitting(false);
    }
  };

  const handleShareToFacebook = (url: string) => {
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbShareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleShareToWhatsApp = (url: string, articleTitle: string) => {
    const text = `Baca refleksi "${articleTitle}" di Let Me Hear You:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const renderPreviewMockup = (tmpl: WebDesignTemplate) => (
    <div className="rounded-[32px] border-4 border-[#3F3766] bg-white shadow-[0_16px_40px_rgba(63,55,102,0.18),0_0_24px_rgba(247,171,197,0.3)] overflow-hidden transition-all flex flex-col lg:min-h-0 lg:flex-1">

      {/* SIMULATED BROWSER TOP BAR */}
      <div className="shrink-0 bg-[#3F3766] px-4 py-3 flex items-center justify-between gap-3 border-b-2 border-[#3F3766]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-3 w-3 rounded-full bg-[#FF5F56] border border-black/20"></span>
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-black/20"></span>
          <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-black/20"></span>
        </div>

        <div className="flex-1 max-w-sm mx-auto flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono font-medium text-[#F5E7C6] border border-white/15 truncate shadow-inner">
          <span>https://{cleanUser}.{activeBaseDomain}</span>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-[10px] font-mono font-bold text-[#F7ABC5] bg-white/10 px-2 py-0.5 rounded-full">
            {tmpl.name}
          </span>
        </div>
      </div>

      {/* SIMULATED TENANT BLOG PAGE CONTENT WITH DYNAMIC TEMPLATE STYLING */}
      <div
        className={`p-6 sm:p-8 min-h-[460px] lg:min-h-0 lg:flex-1 overflow-y-auto space-y-6 transition-colors ${tmpl.previewClass.container}`}
      >
        
        {/* Simulated Header */}
        <div className={`flex items-center justify-between gap-4 ${tmpl.previewClass.header}`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${tmpl.previewClass.authorAvatar}`}
            >
              {cleanUser.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={`text-xs ${tmpl.previewClass.authorName}`}>
                @{cleanUser}
              </p>
              <p className={`text-[10px] ${tmpl.previewClass.authorSub}`}>
                Ruang Publikasi Pribadi
              </p>
            </div>
          </div>

          {registerLitera && (
            <span className={tmpl.previewClass.badge}>
              Web3 Verified
            </span>
          )}
        </div>

        {/* Article Body */}
        <article className="space-y-4">
          {/* Media Header (Image or Video) */}
          {mediaPreview && (
            <div className={tmpl.previewClass.mediaCard}>
              {mediaType === "VIDEO" ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-56 object-cover bg-black"
                />
              ) : (
                <div className="relative w-full h-48 sm:h-56 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaPreview}
                    alt={title || "Cover Artikel"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag, idx) => (
                <span
                  key={idx}
                  className={tmpl.previewClass.tag}
                >
                  #{tag}
                </span>
              ))}
          </div>

          <h1 className={`text-xl sm:text-2xl leading-snug ${tmpl.previewClass.title}`}>
            {title || "Judul Tulisan Anda"}
          </h1>

          {excerpt && (
            <p className={`text-xs sm:text-sm ${tmpl.previewClass.excerpt}`}>
              &ldquo;{excerpt}&rdquo;
            </p>
          )}

          <div className={`text-xs sm:text-sm ${tmpl.previewClass.content}`}>
            {content || "Tuliskan materi atau catatan refleksi Anda pada panel sebelah kiri..."}
          </div>
        </article>

        {/* LITERA OFFICIAL NFT EMBED CARD WITH THEME HARMONY */}
        {registerLitera ? (
          <div className={tmpl.previewClass.literaCard}>
            
            {/* Artwork Cover */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-[#c5baa7] flex items-center justify-center">
              <Image
                src="/assets/sapiens.png"
                alt="Artwork Cover"
                width={180}
                height={180}
                className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] opacity-95"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 border border-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f27438] animate-pulse"></span>
                <span className="text-[9px] font-bold !text-white">
                  Let Me Hear You
                </span>
              </div>
            </div>

            {/* Collection Pill */}
            <div className="mt-4 mb-2 inline-flex items-center gap-1.5 rounded-full bg-black/30 border border-white/20 px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <span>
                {selectedCollection && selectedCollection !== "__new__"
                  ? selectedCollection
                  : newCollectionName || "THE EVERYDAY HUMAN"}
              </span>
            </div>

            {/* Card Title */}
            <h3 className="text-sm sm:text-base font-bold leading-snug truncate max-w-xs mx-auto text-inherit">
              {title || "Judul Artikel Anda"}
            </h3>

            {/* Action CTA Button */}
            <button
              type="button"
              className="w-full max-w-xs mx-auto mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#cf6e3e] to-[#b8582d] !text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Miliki Edisi Digital
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] opacity-70">
              <span>Powered by Litera Protocol</span>
            </div>

          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-current/20 p-3 text-center text-[11px] opacity-60">
            Penerbitan Web3 Dinonaktifkan (Artikel diterbitkan sebagai blog standar)
          </div>
        )}

        <div className="pt-4 border-t border-current/10 flex items-center justify-between text-[10px] opacity-60">
          <span>Diterbitkan via Let Me Hear You</span>
          <span className="font-mono">Hari ini</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* 0A. AUTHENTICATION REQUIRED MODAL (FOR CREATORS) */}
      {!authLoading && !authUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#3F3766] bg-[#FAF8F5] p-6 sm:p-8 shadow-[0_20px_60px_rgba(63,55,102,0.4)] text-center">
            <h2 className="text-xl font-black text-[#3F3766] tracking-tight">
              Masuk untuk Mulai Menulis
            </h2>
            <p className="mt-2 text-xs text-[#3F3766]/70 leading-relaxed">
              Daftar atau masuk ke akun Anda untuk menerbitkan refleksi di subdomain pribadi Anda (<span className="font-mono font-bold text-[#3F3766] underline decoration-[#F7ABC5] decoration-2 underline-offset-2">nama.letmehearyou.id</span>) dan mengamankan sertifikat digital Litera Web3.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/login?next=/builder"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F7ABC5] py-3.5 text-sm font-black text-[#3F3766] shadow-[0_6px_0_0_#3F3766] hover:bg-[#F5E7C6] hover:shadow-[0_4px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#3F3766] active:translate-y-[5px] transition focus:ring-2 focus:ring-[#F7ABC5]/50 focus:outline-none"
              >
                Masuk / Buat Akun Kreator
              </Link>
              <Link
                href="/"
                className="block text-xs font-semibold text-[#3F3766]/60 hover:text-[#3F3766] transition py-1"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 0B. CELEBRATORY POST-PUBLISH MODAL WITH FACEBOOK SHARE */}
      {showPublishSuccessModal && publishedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-lg rounded-3xl border-4 border-[#3F3766] bg-[#FAF8F5] p-6 sm:p-8 shadow-[0_24px_70px_rgba(63,55,102,0.5)] text-center relative">
            <button
              onClick={() => setShowPublishSuccessModal(false)}
              className="absolute top-4 right-4 text-xs font-bold text-[#3F3766]/50 hover:text-[#3F3766] p-2"
              aria-label="Tutup modal"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-[#3F3766] tracking-tight">
              Refleksi Anda Kini Live!
            </h2>
            <p className="mt-1 text-xs text-[#3F3766]/70">
              Artikel & sertifikat digital Litera telah tercatat secara permanen.
            </p>

            {/* Live Link Card */}
            <div className="mt-5 rounded-2xl border-2 border-[#3F3766]/15 bg-white p-3.5 text-left flex items-center justify-between gap-2 shadow-inner">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F3766]/50 block">
                  Link Publikasi
                </span>
                <p className="font-mono text-xs font-bold text-[#3F3766] truncate">
                  {publishedData.url}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyLink(publishedData.url)}
                className="shrink-0 rounded-xl bg-[#3F3766] px-3 py-2 text-xs font-bold text-white hover:bg-[#3F3766]/80 transition"
              >
                {copiedLink ? "✓ Disalin" : "Salin Link"}
              </button>
            </div>

            {/* Social Share Buttons */}
            <div className="mt-5">
              <span className="block text-xs font-bold text-[#3F3766]/80 mb-2.5">
                Bagikan Refleksi Anda:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleShareToFacebook(publishedData.url)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#166fe5] transition active:scale-98"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Bagikan ke Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareToWhatsApp(publishedData.url, publishedData.title)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#20ba59] transition active:scale-98"
                >
                  <span className="text-sm">💬</span>
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Direct Links */}
            <div className="mt-6 flex items-center justify-center gap-3 pt-4 border-t border-[#3F3766]/10">
              <a
                href={publishedData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3F3766] hover:text-[#3F3766]/70 hover:underline"
              >
                <span>Lihat Artikel Live ↗</span>
              </a>
              <span className="text-xs text-[#3F3766]/30">•</span>
              <a
                href={`https://${username}.${activeBaseDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3F3766]/80 hover:text-[#3F3766] hover:underline"
              >
                <span>Lihat Profil Subdomain ↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 0. MANDATORY SUBDOMAIN IDENTITY MODAL (HARD GATE) - Only shown when user is authenticated */}
      {!authLoading && authUser && !isSubdomainConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#3F3766] bg-[#F5E7C6] p-6 sm:p-8 shadow-[0_20px_60px_rgba(63,55,102,0.4)]">
            <div className="mb-6 text-center">
              <span className="inline-block rounded-xl bg-[#3F3766] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#F7ABC5] mb-3">
                Identitas Penerbit
              </span>
              <h2 className="text-xl font-black text-[#3F3766] tracking-tight">
                Tentukan Subdomain Blog
              </h2>
              <p className="mt-1.5 text-xs text-[#3F3766]/75 leading-relaxed">
                Tentukan nama unik untuk alamat publikasi Anda. Anda masih dapat mengubahnya di studio sebelum artikel diterbitkan.
              </p>
            </div>

            <form onSubmit={handleConfirmSubdomain} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-2">
                  Username Subdomain
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono font-bold text-sm text-[#3F3766]/50">
                    @
                  </span>
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(formatUsername(e.target.value))}
                    placeholder="contoh: ratna, budi, maya"
                    autoFocus
                    required
                    className="w-full rounded-2xl border-2 border-[#3F3766] bg-white py-3.5 pl-9 pr-4 text-base font-mono font-bold text-[#3F3766] placeholder:text-[#3F3766]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F7ABC5] transition shadow-inner"
                  />
                </div>
                {subdomainModalError && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {subdomainModalError}
                  </p>
                )}
              </div>

              {/* LIVE DOMAIN BADGE PREVIEW */}
              <div className="rounded-2xl border-2 border-[#3F3766]/20 bg-white/70 p-3.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F3766]/60 block mb-1">
                  Alamat Blog Resmi
                </span>
                <p className="font-mono text-xs font-bold text-[#3F3766] break-all">
                  https://{formatUsername(tempUsername) || "username"}.{activeBaseDomain}
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#F7ABC5] py-3.5 text-sm font-black uppercase tracking-wider text-[#3F3766] border-2 border-[#3F3766] shadow-[0_4px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
              >
                Konfirmasi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1. TOP STUDIO NAVIGATION BAR */}
      <header className="sticky top-0 z-30 border-b border-[#3F3766]/15 bg-[#F5E7C6]/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border-2 border-[#3F3766]/20 shadow-sm transition hover:border-[#3F3766]"
              title="Kembali ke Beranda"
            >
              <span className="text-xs font-black text-[#3F3766]">←</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-[#3F3766]">
                  Studio Canvas
                </span>
                {authProfile?.display_name && (
                  <span className="hidden sm:inline-block text-[11px] font-bold text-[#3F3766]/60">
                    ({authProfile.display_name})
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-[#F7ABC5]/40 px-2 py-0.5 text-[10px] font-bold text-[#3F3766] border border-[#3F3766]/20">
                  Live
                </span>
                {lastSavedTime && (
                  <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-[#3F3766]/60">
                    • Draf tersimpan {lastSavedTime}
                  </span>
                )}
              </div>

              {/* Subdomain in Header with Edit / Lock indicator */}
              <div className="flex items-center gap-2 mt-0.5">
                {isEditingUsernameInStudio && !isPublished ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[#3F3766]/60">https://</span>
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(formatUsername(e.target.value))}
                      className="rounded-lg border border-[#3F3766] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#3F3766] w-28 focus:outline-none"
                      autoFocus
                    />
                    <span className="font-mono text-xs text-[#3F3766]/60">.{activeBaseDomain}</span>
                    <button
                      type="button"
                      onClick={handleSaveInlineUsername}
                      className="rounded bg-[#3F3766] px-2 py-0.5 text-[10px] font-black text-white"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingUsernameInStudio(false)}
                      className="text-[10px] text-[#3F3766]/60 underline"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#3F3766] truncate max-w-[200px] sm:max-w-xs block">
                      {domainPreview}
                    </span>
                    {!isPublished ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTempUsername(username);
                          setIsEditingUsernameInStudio(true);
                        }}
                        className="text-[10px] font-bold text-[#3F3766]/70 underline hover:text-[#3F3766]"
                      >
                        Ubah
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Terkunci
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            {/* MOBILE ONLY SWITCHER (EDITOR VS PREVIEW) */}
            <div className="flex lg:hidden items-center rounded-xl bg-white/70 p-1 border-2 border-[#3F3766]/15 shadow-inner">
              <button
                type="button"
                onClick={() => setMobileActiveTab("editor")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  mobileActiveTab === "editor"
                    ? "bg-[#3F3766] text-white shadow-sm"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setMobileActiveTab("preview")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  mobileActiveTab === "preview"
                    ? "bg-[#3F3766] text-white shadow-sm"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Pratinjau
              </button>
            </div>

            <div className="hidden md:flex items-center rounded-xl bg-white/70 p-1 border-2 border-[#3F3766]/15 shadow-inner">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewDevice === "desktop"
                    ? "bg-[#3F3766] text-white shadow-sm"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewDevice === "mobile"
                    ? "bg-[#3F3766] text-white shadow-sm"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Mobile
              </button>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-[#F7ABC5] px-4 sm:px-6 py-2.5 text-xs font-black tracking-wide text-[#3F3766] uppercase shadow-[0_4px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all border-2 border-[#3F3766] disabled:opacity-50"
            >
              {isSubmitting ? "Menerbitkan..." : "Terbitkan"}
            </button>

            {authUser && (
              <form action={signOutAction} className="inline-flex">
                <button
                  type="submit"
                  title="Keluar dari akun"
                  className="rounded-xl border-2 border-[#3F3766]/20 bg-white/70 px-3 py-2 text-[11px] font-bold text-[#3F3766]/70 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                >
                  Keluar
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      {/* 2. SPLIT WORKSPACE: UNIFIED LEFT CONTROL DECK + RIGHT LIVE MOCKUP */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PANEL KIRI: UNIFIED STREAMLINED CONTROL DECK (COL-SPAN-5) */}
          <div
            className={`lg:col-span-5 space-y-6 ${
              mobileActiveTab === "preview" ? "hidden lg:block" : "block"
            }`}
          >

            {/* ERROR BANNER */}
            {error && (
              <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-xs font-bold text-red-800 shadow-sm leading-relaxed">
                {error}
              </div>
            )}

            {/* SECTION 1: COMPACT TEMPLATE SUMMARY + PICKER TRIGGER */}
            <div className="rounded-3xl bg-white p-4 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-black/20"
                    style={{ backgroundColor: activeTemplate.accentColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-black uppercase tracking-wider text-[#3F3766]">
                      Desain Tampilan Web
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-xs font-black text-[#3F3766]">
                        {activeTemplate.name}
                      </span>
                      <span className="shrink-0 rounded-full border border-[#3F3766]/20 bg-[#F7ABC5] px-1.5 py-px text-[9px] font-bold text-[#3F3766]">
                        {DESIGN_TEMPLATES.length} Gaya
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenTemplatePicker}
                  className="shrink-0 rounded-xl border-2 border-[#3F3766] bg-[#F7ABC5] px-3 py-2 text-[11px] font-black text-[#3F3766] shadow-[0_4px_0_0_#3F3766] hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#3F3766] active:translate-y-[3px] transition focus:ring-2 focus:ring-[#F7ABC5]/50 focus:outline-none"
                >
                  Ganti tema ↻
                </button>
              </div>

              {/* QUICK PROMPT INSPIRATION HELPER */}
              <div className="pt-3 border-t border-[#3F3766]/10">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer rounded-xl text-[11px] font-bold text-[#3F3766]/75 hover:text-[#3F3766] select-none list-none py-1">
                    <span>💡 Butuh inspirasi contoh teks refleksi?</span>
                    <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {REFLECTION_TEMPLATES.map((promptTmpl) => (
                      <button
                        key={promptTmpl.id}
                        type="button"
                        onClick={() => handleApplyReflectionPrompt(promptTmpl)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#3F3766]/15 bg-[#F5E7C6]/20 px-3 py-2 text-left text-[10px] text-[#3F3766] transition hover:bg-[#F5E7C6]/50"
                      >
                        <span className="min-w-0 flex-1 leading-snug">{promptTmpl.name}</span>
                        <span className="shrink-0 font-bold text-[#3F3766]/60">Muat →</span>
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            {/* SECTION 2: ARTICLE CONTENT FORM */}
            <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                  Judul Tulisan
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tuliskan judul artikel Anda..."
                  required
                  className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-3 text-sm font-bold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                  Ringkasan / Sinopsis (Excerpt)
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Satu atau dua kalimat pembuka..."
                  className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                    Isi Tulisan
                  </label>
                  <span className="text-[10px] font-mono font-bold text-[#3F3766]/60">
                    {content.length} karakter
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan pengalaman atau materi Anda di sini..."
                  required
                  className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white p-4 text-xs font-medium text-[#3F3766] placeholder:text-[#3F3766]/40 leading-relaxed focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition font-sans resize-y shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                  Kategori / Tag (Pisahkan koma)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Kesehatan Mental, Pemulihan, Refleksi"
                  className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-2 text-xs font-semibold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition"
                />
              </div>

              {/* MEDIA ASSET (IMAGE / VIDEO SWITCHER FOR USER) */}
              <div className="pt-2 border-t border-[#3F3766]/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                    Media Sampul Artikel (Cover Asset)
                  </label>
                  <div className="flex rounded-xl bg-[#3F3766]/10 p-1">
                    <button
                      type="button"
                      onClick={() => setMediaType("IMAGE")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        mediaType === "IMAGE" ? "bg-[#3F3766] text-white shadow" : "text-[#3F3766]/70"
                      }`}
                    >
                      Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType("VIDEO")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        mediaType === "VIDEO" ? "bg-[#3F3766] text-white shadow" : "text-[#3F3766]/70"
                      }`}
                    >
                      Video MP4
                    </button>
                  </div>
                </div>

                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={mediaType === "IMAGE" ? "image/png,image/jpeg,image/webp" : "video/mp4"}
                  onChange={handleMediaFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => mediaInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-[#3F3766]/20 bg-[#F5E7C6]/30 hover:bg-[#F5E7C6]/50 p-4 text-center cursor-pointer transition flex items-center justify-center gap-3"
                >
                  <span className="h-9 w-9 rounded-xl bg-[#3F3766] text-[#F7ABC5] flex items-center justify-center font-bold text-sm shadow-sm">
                    ↑
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3F3766]">
                      {mediaFileName || (mediaType === "IMAGE" ? "Pilih Gambar Sampul (JPG/PNG/WEBP)" : "Pilih Video Singkat (MP4)")}
                    </p>
                    <p className="text-[10px] text-[#3F3766]/60">
                      Tampil di halaman blog dan visual token NFT resmi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: UNIFIED LITERA WEB3 INTEGRATION CARD (NO SEPARATE TAB) */}
            <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#3F3766] block">
                    Penerbitan Sertifikat Web3 (Litera Protocol)
                  </span>
                  <p className="text-[11px] text-[#3F3766]/70 leading-relaxed mt-1">
                    Aktifkan untuk menerbitkan artikel ini ke jaringan blockchain Polygon sebagai sertifikat digital permanen.
                  </p>
                </div>

                {/* 3D TOGGLE SWITCH */}
                <button
                  type="button"
                  onClick={() => handleToggleLitera(!registerLitera)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-[#3F3766] transition-colors duration-200 ease-in-out focus:outline-none ${
                    registerLitera ? "bg-[#F7ABC5]" : "bg-[#3F3766]/20"
                  }`}
                  title={registerLitera ? "Penerbitan Web3 Aktif" : "Penerbitan Web3 Dinonaktifkan"}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border border-[#3F3766] shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                      registerLitera ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {registerLitera ? (
                <div className="space-y-4 pt-3 border-t border-[#3F3766]/10">
                  
                  {/* SECURITY HARDENING BANNER: PROMINENT WARNING IF WALLET NOT CONNECTED */}
                  {!creatorWallet ? (
                    <div className="rounded-2xl border-2 border-[#F7ABC5] bg-[#F5E7C6]/30 p-4 space-y-2.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#3F3766] text-[#F5E7C6] flex items-center justify-center text-xs font-black">
                          💎
                        </span>
                        <h4 className="text-xs font-bold text-[#3F3766] uppercase tracking-wide">
                          Autentikasi Sertifikat Litera
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#3F3766]/80 leading-relaxed font-medium">
                        Hubungkan akun dompet Litera agar karya Anda otomatis terdaftar sebagai sertifikat digital resmi dan hak royalti tercatat atas nama Anda.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsLoginModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#F7ABC5] hover:bg-[#f59bb9] text-[#3F3766] text-xs font-bold tracking-wide border-2 border-[#3F3766] shadow-[0_3px_0_0_#3F3766] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#3F3766] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                      >
                        Hubungkan Akun Litera
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#3F3766]">
                          Akun Dompet Penulis Terverifikasi
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsLoginModalOpen(true)}
                          className="text-xs font-black text-[#3F3766] underline hover:text-[#3F3766]/70"
                        >
                          Ganti Akun
                        </button>
                      </div>

                      <div className="p-3 bg-[#F7ABC5]/20 rounded-2xl border-2 border-[#3F3766]/20 flex items-center gap-3">
                        <span className="h-7 w-7 rounded-xl bg-[#3F3766] text-white flex items-center justify-center text-xs font-black">
                          OK
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#3F3766] truncate">{loginMethod || "Litera Cloud Wallet"}</p>
                          <p className="text-[10px] font-mono text-[#3F3766]/80 truncate">{creatorWallet}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMART DYNAMIC COLLECTION */}
                  <div>
                    <label className="block text-xs font-bold text-[#3F3766] mb-1.5">
                      Pilihan Koleksi Litera
                    </label>
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border-2 border-[#3F3766]/15 bg-white text-[#3F3766] focus:outline-none focus:border-[#3F3766]"
                    >
                      <option value="">Let Me Hear You - Jurnal & Refleksi (Default)</option>
                      <option value="Ruang Pemulihan & Self-Care">Ruang Pemulihan & Self-Care</option>
                      <option value="Jurnal Mindfulness Harian">Jurnal Mindfulness Harian</option>
                      <option value="__new__">+ Buat Koleksi Baru...</option>
                    </select>

                    {selectedCollection === "__new__" && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-[#F5E7C6]/50 border-2 border-[#3F3766]/20 space-y-2">
                        <label className="block text-[11px] font-bold text-[#3F3766]">
                          Nama Koleksi Baru
                        </label>
                        <input
                          type="text"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="Misal: Catatan Pemulihan Pribadi"
                          className="w-full text-xs px-3 py-2 rounded-xl border-2 border-[#3F3766]/20 focus:outline-none focus:border-[#3F3766]"
                        />
                      </div>
                    )}
                  </div>

                  {/* UNLOCKABLE CONTENT LINK */}
                  <div>
                    <label className="block text-xs font-bold text-[#3F3766] mb-1">
                      Tautan Materi Eksklusif (Opsional)
                    </label>
                    <input
                      type="url"
                      value={unlockableUrl}
                      onChange={(e) => setUnlockableUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full text-xs px-3 py-2 rounded-xl border-2 border-[#3F3766]/15 bg-white text-[#3F3766] placeholder:text-[#3F3766]/40 focus:outline-none focus:border-[#3F3766]"
                    />
                    <p className="text-[10px] text-[#3F3766]/60 mt-1">
                      Hanya dapat diakses pembaca setelah berhasil mengklaim sertifikat NFT.
                    </p>
                  </div>

                  {/* PROOF OF READING QUIZ */}
                  <div className="pt-2 border-t border-[#3F3766]/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#3F3766] block">
                          Kuis Refleksi Pembaca (Proof of Reading)
                        </span>
                        <span className="text-[10px] text-[#3F3766]/60">
                          Uji pemahaman pembaca sebelum sertifikat diberikan.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableQuiz}
                        onChange={(e) => setEnableQuiz(e.target.checked)}
                        className="h-4 w-4 rounded border-[#3F3766] text-[#3F3766] focus:ring-[#F7ABC5]"
                      />
                    </div>

                    {enableQuiz && (
                      <div className="p-3.5 rounded-2xl bg-[#F5E7C6]/50 border-2 border-[#3F3766]/20 space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[#3F3766] mb-1">
                            Pertanyaan Kuis
                          </label>
                          <input
                            type="text"
                            value={quizQuestion}
                            onChange={(e) => setQuizQuestion(e.target.value)}
                            placeholder="Apa poin utama dari tulisan ini?"
                            className="w-full text-xs px-3 py-2 rounded-xl border-2 border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-[#3F3766]">
                            Pilihan Jawaban (Pilih radio untuk kunci benar)
                          </label>
                          {quizOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correctQuizOption"
                                checked={correctIndex === idx}
                                onChange={() => setCorrectIndex(idx)}
                                className="text-[#3F3766] focus:ring-[#F7ABC5]"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...quizOptions];
                                  updated[idx] = e.target.value;
                                  setQuizOptions(updated);
                                }}
                                placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#3F3766]/20 bg-[#F5E7C6]/20 p-4 text-center">
                  <p className="text-xs font-bold text-[#3F3766]/70">
                    Penerbitan Web3 Dinonaktifkan
                  </p>
                  <p className="text-[11px] text-[#3F3766]/50 mt-1">
                    Artikel akan diterbitkan sebagai blog standar tanpa sertifikat NFT.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* PANEL KANAN: LIVE MOCKUP CANVAS (COL-SPAN-7) */}
          <div
            className={`lg:col-span-7 lg:sticky lg:top-20 ${
              mobileActiveTab === "editor" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="flex flex-col items-center lg:h-[calc(100vh-7rem)]">
              <div
                className={`w-full transition-all duration-300 lg:flex lg:h-full lg:flex-col ${
                  previewDevice === "mobile" ? "max-w-sm" : "max-w-full"
                }`}
              >
                {renderPreviewMockup(activeTemplate)}

                <div className="mx-auto h-2 w-3/4 shrink-0 rounded-full bg-[#3F3766]/10 blur-sm mt-3"></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: TEMPLATE PICKER (ARCADE CHARACTER SELECT) */}
      {showTemplatePicker && (
        <TemplatePickerDialog
          templates={DESIGN_TEMPLATES}
          activeId={selectedTemplateId}
          stagedId={stagedTemplateId}
          onStage={setStagedTemplateId}
          onApply={handleApplyStagedTemplate}
          onClose={() => setShowTemplatePicker(false)}
          renderPreview={renderPreviewMockup}
        />
      )}

      {/* MODAL: PREVIEW & CONFIRMATION BEFORE PUBLISH */}
      {showConfirmPublishModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowConfirmPublishModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pratinjau dan konfirmasi penerbitan"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg max-h-[92vh] flex-col rounded-3xl border-4 border-[#3F3766] bg-[#FAF8F5] p-5 shadow-[0_24px_70px_rgba(63,55,102,0.5)]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#3F3766] tracking-tight">
                  Pratinjau &amp; Konfirmasi Terbit
                </h2>
                <p className="text-[11px] text-[#3F3766]/70 leading-relaxed">
                  Periksa tampilan artikel di bawah ini sebelum benar-benar diterbitkan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPublishModal(false)}
                className="rounded-lg p-2 text-xs font-bold text-[#3F3766]/50 hover:text-[#3F3766] hover:bg-white transition"
                aria-label="Tutup pratinjau"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Preview & Notes */}
            <div className="mt-4 space-y-4 overflow-y-auto pr-1">
              {/* LIVE PREVIEW OF THE FINAL ARTICLE */}
              <div className="overflow-hidden rounded-2xl border-2 border-[#3F3766]/20 bg-white">
                {renderPreviewMockup(activeTemplate)}
              </div>

              {/* Publication Summary */}
              <div className="space-y-1.5 rounded-2xl border-2 border-[#3F3766]/15 bg-white p-3.5">
                <div className="flex items-start justify-between gap-3 text-[11px]">
                  <span className="shrink-0 font-bold text-[#3F3766]/60">Alamat Artikel</span>
                  <span className="font-mono font-bold text-[#3F3766] text-right break-all">
                    {domainPreview}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="shrink-0 font-bold text-[#3F3766]/60">Desain Template</span>
                  <span className="font-bold text-[#3F3766] text-right">{activeTemplate.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="shrink-0 font-bold text-[#3F3766]/60">Sertifikat Web3 Litera</span>
                  <span className={`font-bold ${registerLitera ? "text-emerald-700" : "text-[#3F3766]/60"}`}>
                    {registerLitera && creatorWallet
                      ? `Aktif • ${creatorWallet.slice(0, 6)}…${creatorWallet.slice(-4)}`
                      : "Nonaktif"}
                  </span>
                </div>
              </div>

              {/* IMPORTANT: DATA THAT CANNOT BE CHANGED */}
              <div className="rounded-2xl border-2 border-[#F7ABC5] bg-[#F5E7C6]/40 p-3.5 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#3F3766]">
                  ⚠️ Catatan Penting — Tidak Bisa Diubah Setelah Terbit
                </p>
                <ul className="space-y-1.5 text-[11px] text-[#3F3766]/85 leading-relaxed list-disc pl-4">
                  <li>
                    <strong>Alamat subdomain dikunci.</strong> {domainPreview} tidak dapat diubah lagi
                    setelah artikel terbit.
                  </li>
                  <li>
                    <strong>URL artikel permanen.</strong> Alamat dibuat otomatis dari judul dan tidak
                    dapat diganti.
                  </li>
                  {registerLitera && creatorWallet && (
                    <li>
                      <strong>Sertifikat Litera bersifat permanen.</strong> Tercatat di blockchain
                      Polygon atas dompet {creatorWallet.slice(0, 6)}…{creatorWallet.slice(-4)} dan
                      tidak dapat diedit atau dihapus.
                    </li>
                  )}
                  <li>
                    <strong>Studio terkunci.</strong> Setelah terbit, draf lokal dihapus dan panel
                    studio terkunci — pastikan semua data sudah benar.
                  </li>
                </ul>
              </div>

              {error && (
                <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-3 text-[11px] font-bold text-red-800 leading-relaxed">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowConfirmPublishModal(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border-2 border-[#3F3766]/25 bg-white px-4 py-3 text-xs font-bold text-[#3F3766]/80 hover:bg-[#F5E7C6]/40 transition disabled:opacity-50"
              >
                ← Kembali Mengedit
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPublish()}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-[#F7ABC5] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#3F3766] border-2 border-[#3F3766] shadow-[0_4px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Menerbitkan..." : "Terbitkan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUTH LITERA POPUP */}
      <LiteraLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
