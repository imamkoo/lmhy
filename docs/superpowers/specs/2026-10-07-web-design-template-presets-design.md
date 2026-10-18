# Spec: Web Design Template Presets & Realtime Mobile-First Studio Preview

**Date:** 2026-10-07  
**Status:** Approved for Implementation Planning  
**Target:** Let Me Hear You Web Builder & Multi-Tenant Article Reader  

---

## 1. Overview & Objectives

Transform the current text-based reflection prompt selector in the Web Builder studio into a **Visual Web Design Template Engine**. Creators can select different aesthetic designs for each published article. 

### Key Requirements:
1. **Per-Article Design Preset Selection:** Each article can use its own distinct visual design template (`template_id`), while keeping default content safe from being overwritten when changing templates.
2. **Instant Realtime Canvas Preview:** The live preview canvas (both Desktop & Mobile device simulation modes) dynamically applies the full visual identity (colors, fonts, borders, shadows, backgrounds, badges, and card styles) of the selected template as the author types title, excerpt, and content.
3. **Mobile-First Responsive Experience:** Full optimization for mobile devices. The template selector in mobile studio uses touch-friendly horizontal swipe or responsive 2-column cards, and the public article reader layout seamlessly scales across all viewport sizes.
4. **Default Canonical Theme:** The default template is **Warm Sanctuary** (Let Me Hear You brand standard).

---

## 2. Design Templates Registry

We provide 5 curated, clean, and publication-ready templates:

| Template ID | Display Name | Visual Style & Palette | Typography & Feel |
| :--- | :--- | :--- | :--- |
| **`warm-sanctuary`** *(Default)* | **Warm Sanctuary** | Soft Pink (`#F7ABC5`), Deep Plum (`#3F3766`), Warm Sand (`#F5E7C6`), rounded 3D layered button & soft cards. | Poppins / Heebo. Hangat, ramah, dan menenangkan. |
| **`neo-brutalism`** | **Neo-Brutalism Editorial** | White / cream background, solid 2-3px black borders (`border-black`), deep offset drop shadows (`shadow-[4px_4px_0_#000]`), high-contrast punchy badges. | JetBrains Mono / Heebo Bold. Berani, modern, tegas, ala majalah indie/zines. |
| **`glassmorphism`** | **Aetheric Glass** | Translucent frosted glass card (`backdrop-blur-md bg-white/70`), white crystal shimmer border (`border-white/80`), subtle floating elevation. | Poppins Sans. Bersih, estetik, futuristik, dan ringan. |
| **`editorial-zen`** | **Editorial Zen (Classic Paper)** | Warm parchment background (`#FAF7F2`), charcoal ink (`#1A1A1A`), fine minimalist borders (`border-[#1A1A1A]/15`), generous line-height. | Serif / Merriweather feel with clean headings. Sangat nyaman untuk esai panjang & refleksi mendalam. |
| **`midnight-serenity`** | **Midnight Serenity (Dark)** | Deep obsidian slate (`#0D1117`), violet/lavender accents (`#A78BFA`), luminous pearl text (`#F0F6FC`), dark-mode glow cards. | Modern Dark Sans. Elegan, fokus, nyaman untuk membaca malam hari. |

---

## 3. Architecture & Data Flow

### 3.1 Template Metadata Helper (`src/lib/design-templates.ts`)
```ts
export interface WebDesignTemplate {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  previewClass: {
    container: string;
    header: string;
    title: string;
    excerpt: string;
    content: string;
    tag: string;
    badge: string;
    mediaCard: string;
    literaCard: string;
    authorAvatar: string;
  };
}
```
Helper function `getDesignTemplate(id: string): WebDesignTemplate` returns the matching template or falls back to `warm-sanctuary`.

### 3.2 Database Schema & Storage
1. **Migration (`supabase/migrations/20261007000000_add_template_id_to_articles.sql`):**
   ```sql
   ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'warm-sanctuary';
   ```
2. **TypeScript Database Interface (`src/lib/supabase/types.ts`):**
   Add `template_id?: string | null` to `articles` row and insert types.
3. **Article Storage (`src/lib/article-storage.ts` & `src/lib/tenant-storage.ts`):**
   Accept and save `template_id` in `createArticle` and return `template_id` in article queries.

### 3.3 Studio Canvas & Mobile UI (`src/app/builder/WebBuilderClient.tsx`)
1. Replace text-replacement preset buttons with visual template selector cards showing mini design badges.
2. Selecting a template updates `selectedTemplateId` without overwriting the author's input (`title`, `excerpt`, `content`).
3. The Live Canvas in the right pane (or mobile preview modal/tab) immediately re-renders using the selected template classes.
4. Mobile layout improvements: Sticky device toggle, quick template bar, and responsive touch controls.

### 3.4 Multi-Tenant Article Reader (`src/app/tenant/[username]/[slug]/page.tsx`)
1. Fetch `template_id` from the database article (defaulting to `'warm-sanctuary'`).
2. Wrap the article container in the template's background, typography, borders, and badge styles.
3. Render `SocialShareBar`, `FollowButton`, and `LiteraWidget` harmoniously within the selected theme palette.

---

## 4. Verification & Quality Gate
- `npm run lint` must pass (Exit 0).
- `npx tsc --noEmit` must pass (Exit 0).
- `npm run build` must succeed without SSR hydration mismatch or broken CSS classes.
- Verified on both mobile screen viewport (< 640px) and desktop (> 1024px).
