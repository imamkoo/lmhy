# Web Builder Split Studio (3D, Glow & Minimalist Live Canvas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah `/builder` dari formulir vertikal kaku menjadi Web Studio interaktif bergaya split-screen (Side-by-side Live Mockup Canvas + tactile control dock) dengan sentuhan 3D bevel, neon glow, layered shadow, dan palet `#F7ABC5` (pink), `#3F3766` (deep indigo), dan `#F5E7C6` (warm beige).

**Architecture:** 
- **Studio Header / Floating Nav:** Studio title, live status draft badge, viewport switcher (Desktop / Mobile Preview), action button 3D glow "Terbitkan Blog".
- **Left Dock (Config & Content Deck):** Subdomain inspector, quick template selector pills/cards, direct title & reflection editor, Litera Web3 Cloud toggle badge.
- **Right Viewport (Live Browser Mockup Canvas):** Simulated browser frame with glassmorphism toolbar, live updating domain URL bar, rendered responsive tenant blog post preview in real-time.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide/Heroicons inline SVG icons, Warm Sanctuary + Custom Studio tokens.

---

### Task 1: Bangun Komponen Split Studio Web Builder (`WebBuilderClient.tsx`)

**Files:**
- Modify: `src/app/builder/WebBuilderClient.tsx`
- Modify: `src/app/builder/page.tsx`

**Key Features to Implement:**
1. Split-screen layout (`grid lg:grid-cols-12 min-h-screen gap-6 lg:gap-8`).
2. Sticky Top Navigation Bar dengan domain preview badge yang glowing (`shadow-[0_0_20px_rgba(247,171,197,0.35)]`).
3. Viewport Mode Switcher (`Desktop` vs `Mobile`) yang secara dinamis mengubah lebar canvas simulasi di sisi kanan (`w-full` vs `max-w-sm`).
4. Editor panel kiri dengan floating tactile cards, 3D buttons, dan input fields clean minimalist.
5. Canvas simulasi kanan lengkap dengan Browser Frame (Dot window buttons merah/kuning/hijau, live address bar, live rendered typography, tags, dan author badge).
6. Litera Web3 modal & account state toggle dengan 3D interactive switch.

---
