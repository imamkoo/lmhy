# Web Design Template Presets & Realtime Mobile-First Studio Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Web Builder reflection prompts into a visual Web Design Template Engine with 5 clean presets (Warm Sanctuary, Neo-Brutalism, Aetheric Glass, Editorial Zen, Midnight Serenity), dynamic realtime live canvas preview, mobile-first touch optimization, and per-article public reader styling.

**Architecture:** A centralized template token registry (`src/lib/design-templates.ts`) exports metadata and Tailwind classes for each template. `WebBuilderClient.tsx` uses this registry to render a visual preset picker and dynamically style the live mockup canvas without touching user content. The `template_id` is persisted to Supabase and used by `TenantArticlePage` (`src/app/tenant/[username]/[slug]/page.tsx`) to render published articles in the chosen theme.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-10-07-web-design-template-presets-design.md`

## Global Constraints
- **Preserve User Content:** Switching templates must never clear or overwrite `title`, `excerpt`, or `content`.
- **Default Theme:** If `template_id` is missing or invalid, default to `'warm-sanctuary'`.
- **Clean Publication Aesthetics:** Presets must look professional, reader-friendly, and suitable for articles/news.
- **Mobile-First Responsiveness:** Studio and reader must be optimized for mobile screens (< 640px).
- **Quality Gate:** `npm run lint`, `npx tsc --noEmit`, and `npm run build` must all pass before completion.

## Review Focus
1. **Invalid/Missing Template Fallback:** An article with `template_id = null` or an unrecognized string must cleanly fall back to `warm-sanctuary` without crashing.
2. **Content Preservation on Preset Click:** Clicking different design templates in the studio must not clear already typed article text.
3. **Mobile Viewport Usability:** The template picker cards and live preview toggle must render without horizontal layout overflow on screens ≤ 390px.
4. **Contrast & Readability in Dark Theme:** The `midnight-serenity` dark theme must maintain high contrast for article prose and tags.
5. **Backwards Compatibility:** Legacy articles without `template_id` in the database must render properly.

---

### Task 1: Design Templates Registry & Helper

**Files:**
- Create: `src/lib/design-templates.ts`
- Create: `src/__tests__/design-templates.test.ts`

**Interfaces:**
- Produces: `WebDesignTemplate`, `DESIGN_TEMPLATES`, `getDesignTemplate(id?: string): WebDesignTemplate`

- [ ] **Step 1: Write unit tests for design template registry**
  Verify that `getDesignTemplate` returns the matching template for all 5 valid IDs (`warm-sanctuary`, `neo-brutalism`, `glassmorphism`, `editorial-zen`, `midnight-serenity`), and returns `warm-sanctuary` for undefined or unknown IDs.

- [ ] **Step 2: Implement `src/lib/design-templates.ts`**
  Implement the 5 templates with detailed Tailwind utility classes for:
  - `container` (background, borders, shadows)
  - `header` (creator avatar, username, badge)
  - `title` (font size, weight, font family, color)
  - `excerpt` (quote style, italic, left border)
  - `content` (prose typography, leading, paragraph spacing)
  - `tag` (tag pill background, border, text color)
  - `badge` (verification tag style)
  - `mediaCard` (cover container border & shadow)
  - `literaCard` (Web3 NFT card styling)

- [ ] **Step 3: Run unit tests and verify**
  Run tests to ensure template registry works as expected.

- [ ] **Step 4: Commit Task 1**
  `git commit -m "feat(templates): implement web design template registry and helper"`

---

### Task 2: Database Schema & Article Storage Integration

**Files:**
- Create: `supabase/migrations/20261007000000_add_template_id_to_articles.sql`
- Modify: `src/lib/supabase/types.ts`
- Modify: `src/lib/article-storage.ts`
- Modify: `src/lib/tenant-storage.ts`

**Interfaces:**
- Consumes: `template_id` string
- Produces: Updated `Article` and `CreateArticleInput` types supporting `template_id`

- [ ] **Step 1: Create SQL migration**
  Add `template_id TEXT DEFAULT 'warm-sanctuary'` to `public.articles`.

- [ ] **Step 2: Update TypeScript definitions**
  Add `template_id?: string | null` to `Article` interface in `types.ts`, `article-storage.ts`, and `tenant-storage.ts`.

- [ ] **Step 3: Update `createArticle` in `article-storage.ts`**
  Persist `template_id: input.template_id || 'warm-sanctuary'` during insert.

- [ ] **Step 4: Commit Task 2**
  `git commit -m "feat(storage): support template_id in database schema and article storage"`

---

### Task 3: Studio Canvas UI - Visual Template Selector & Realtime Live Preview

**Files:**
- Modify: `src/app/builder/WebBuilderClient.tsx`

**Interfaces:**
- Consumes: `DESIGN_TEMPLATES`, `getDesignTemplate` from `src/lib/design-templates.ts`
- Produces: Dynamic realtime mockup canvas responding to `selectedTemplateId`

- [ ] **Step 1: Replace text reflection prompts with visual design template selector**
  - Render 5 template cards with visual mini-swatches and distinctive badges.
  - Selecting a template updates `selectedTemplateId` without altering `title`, `excerpt`, or `content`.
  - Provide a subtle "Muat Contoh Teks" (Load Sample Text) helper button for authors who still want writing prompts without forcing it.

- [ ] **Step 2: Connect live preview canvas to active template styling**
  - Compute active template via `getDesignTemplate(selectedTemplateId)`.
  - Apply active template styling to the simulated browser card, header, title, tags, media cover, prose content, and Litera card in the live canvas.

- [ ] **Step 3: Mobile-first optimizations in studio**
  - Add quick preview toggle bar for mobile users to switch between "Editor" and "Pratinjau Langsung" easily.
  - Ensure touch targets for template selector cards are large and touch-friendly.

- [ ] **Step 4: Pass `template_id` to publication payload**
  - Include `template_id: selectedTemplateId` when creating/publishing the article.

- [ ] **Step 5: Commit Task 3**
  `git commit -m "feat(builder): add visual design template picker and realtime live preview"`

---

### Task 4: Public Article Reader Template Rendering

**Files:**
- Modify: `src/app/tenant/[username]/[slug]/page.tsx`

**Interfaces:**
- Consumes: `article.template_id` and `getDesignTemplate` from `src/lib/design-templates.ts`
- Produces: Public article reader page rendered according to the author's selected template

- [ ] **Step 1: Retrieve and apply template in `TenantArticlePage`**
  - Read `dbArticle?.template_id || legacyArticle?.template_id || 'warm-sanctuary'`.
  - Look up template via `getDesignTemplate(templateId)`.
  - Wrap the article container, header, tags, media cover, prose paragraphs, and share section with the template's designated classes.

- [ ] **Step 2: Harmonize Litera widget and navigation**
  - Ensure back navigation and Litera widget borders/shadows blend naturally with each template's palette (e.g. bold black borders in Neo-Brutalism, frosted glass in Glassmorphism, deep dark card in Midnight Serenity).

- [ ] **Step 3: Commit Task 4**
  `git commit -m "feat(reader): render public article pages with author-selected design templates"`

---

### Task 5: End-to-End Verification & Quality Gate

**Files:**
- All touched files

- [ ] **Step 1: Run linter**
  `npm run lint` (Must exit 0)

- [ ] **Step 2: Run typecheck**
  `npx tsc --noEmit` (Must exit 0)

- [ ] **Step 3: Run production build**
  `npm run build` (Must exit 0)

- [ ] **Step 4: Commit any final polishing**
  `git commit -m "chore: verify web design template presets quality gate"`
