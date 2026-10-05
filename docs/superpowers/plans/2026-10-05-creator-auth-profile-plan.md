# Creator Authentication, Medium-style Profiles & Social Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, multi-provider creator authentication system (Email, Google, Facebook OAuth), persistent PostgreSQL database schemas (Profiles, Articles, Follows, Comments) via Supabase, mandatory subdomain username onboarding, Medium-style creator profile pages, and community engagement features (Follow, Share, Comments) on Let Me Hear You.

**Architecture:** Next.js 16 App Router + React 19 + Supabase Client (`@supabase/supabase-js` & `@supabase/ssr`) with SSR Cookie handling. Database schema structured with Row Level Security (RLS) policies. Profiles bind to subdomains (e.g., `axaa.letmehearyou.id`), Web Builder (`/builder`) is gated to authenticated authors, and `/tenant/[username]/[slug]` includes responsive Medium-style author cards, social share buttons, and nested comments.

**Tech Stack:** Next.js 16.3.0, React 19.2.4, TypeScript 5, Tailwind CSS v4, Supabase (PostgreSQL, Auth, Storage).

**Spec:** `docs/superpowers/specs/2026-10-05-creator-auth-profile-design.md`

## Global Constraints
- Framework: Next.js 16.3.0 (App Router), React 19.2.4
- UI Styling: Tailwind CSS v4 tokens, accessible semantic HTML, responsive mobile-first layouts
- Auth engine: `@supabase/ssr` (cookie-based sessions compatible with Next.js Server Components and Server Actions)
- Subdomain Routing: Compatible with `src/middleware.ts` routing conventions and wildcard DNS
- Data Safety: Zero destructive schema drops; RLS policies must protect author writes while keeping reading public

## Review Focus
1. First-time OAuth sign-in without a selected username must strictly be intercepted by the Onboarding Gate before accessing `/builder` or writing articles.
2. Username validation must reject uppercase, spaces, and invalid symbols (must strictly match `^[a-z0-9-]+$`) to prevent breaking DNS hostname conventions.
3. Builder publishing must verify that `session.user.id === profile.id`, completely preventing author impersonation across subdomains.
4. Comments and Follow interactions must handle unauthenticated users gracefully by opening a login prompt without losing page state or triggering full page reloads.
5. In-memory article fallback (`tenant-storage.ts`) must seamlessly merge or migrate to Supabase `articles` table so existing demo articles continue rendering.

---

## File Structure & Responsibilities

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client (cookies)
│   │   ├── middleware.ts         # Session refresh helper for Next.js middleware
│   │   └── types.ts              # Database schema TypeScript types
│   ├── profile-storage.ts        # Profile queries, stats & social metadata
│   ├── article-storage.ts        # Persistent Supabase article queries & mutations
│   └── comment-storage.ts        # Comments & Follows queries & mutations
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # Login & Registration page (Google, FB, Email)
│   │   └── onboarding/page.tsx   # Mandatory username & subdomain selection gate
│   ├── actions/
│   │   ├── auth.ts               # Server actions for login, logout, OAuth init
│   │   ├── profile.ts            # Server actions for updating profile & avatar/banner
│   │   ├── community.ts          # Server actions for follow/unfollow and comments
│   │   └── tenant.ts             # Updated persistent article publishing action
│   ├── tenant/
│   │   └── [username]/
│   │       ├── page.tsx          # Medium-style creator profile layout
│   │       ├── [slug]/page.tsx   # Article reader with Author card, Share & Comments
│   │       └── components/
│   │           ├── ProfileBanner.tsx     # Wide cover banner & Avatar component
│   │           ├── FollowButton.tsx      # Interactive follow/unfollow button
│   │           ├── SocialShareBar.tsx    # Facebook & multi-platform share bar
│   │           └── CommentSection.tsx    # Live comment list & submission form
│   └── builder/
│       └── WebBuilderClient.tsx  # Gated builder requiring creator login
```

---

### Task 1: Supabase Client, Database Types, and Migration Script

**Files:**
- Create: `src/lib/supabase/types.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `supabase/migrations/20261005000000_initial_schema.sql`
- Test: `scripts/test-supabase-types.ts`

**Interfaces:**
- Produces: `createClient()` for browser, `createClient()` for Server Components/Actions, and typed DB schema definitions (`Database`).

- [ ] **Step 1: Install `@supabase/supabase-js` and `@supabase/ssr`**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create SQL migration script `supabase/migrations/20261005000000_initial_schema.sql`**
Define PostgreSQL tables: `profiles`, `articles`, `follows`, `comments`, along with safe RLS policies as detailed in Section 3 of the Spec.

- [ ] **Step 3: Define TypeScript DB interfaces in `src/lib/supabase/types.ts`**
Provide strongly typed models matching `profiles`, `articles`, `follows`, and `comments`.

- [ ] **Step 4: Implement browser and server Supabase clients**
- In `src/lib/supabase/client.ts`: `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`.
- In `src/lib/supabase/server.ts`: `createServerClient` using `next/headers` cookies.

- [ ] **Step 5: Verify build & typecheck**
Run: `npx tsc --noEmit && npm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/lib/supabase/ supabase/ package.json package-lock.json
git commit -m "feat(supabase): setup supabase client, schema definitions, and migration script"
```

---

### Task 2: Authentication Handlers, Login UI & Subdomain Onboarding Gate

**Files:**
- Create: `src/app/actions/auth.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/onboarding/page.tsx`
- Modify: `src/middleware.ts`

**Interfaces:**
- Produces: `signInWithGoogleAction()`, `signInWithFacebookAction()`, `signInWithEmailAction()`, `signUpWithEmailAction()`, `signOutAction()`, `completeOnboardingAction(username, displayName)`.

- [ ] **Step 1: Implement auth server actions in `src/app/actions/auth.ts`**
OAuth redirects for Google & Facebook with appropriate scopes (`public_profile`, `email`), email/password authentication, and profile completion with username uniqueness checks.

- [ ] **Step 2: Build `/login` UI in `src/app/(auth)/login/page.tsx`**
Card with Google, Facebook, and Email/Password login inputs, following LMHY's warm aesthetic (`#d07954` terracotta accents, soft rounded borders).

- [ ] **Step 3: Build `/onboarding` UI in `src/app/(auth)/onboarding/page.tsx`**
Identity selection gate with live debounced username availability check, domain preview `https://[username].letmehearyou.id`, and display name input.

- [ ] **Step 4: Update `src/middleware.ts` to enforce Onboarding Gate**
If user has an active Supabase session but `profile.username` is missing, redirect to `/onboarding`.

- [ ] **Step 5: Verify build & lint**
Run: `npm run lint && npx tsc --noEmit && npx next build`
Expected: PASS with exit code 0.

- [ ] **Step 6: Commit**
```bash
git add src/app/actions/auth.ts src/app/\(auth\)/ src/middleware.ts
git commit -m "feat(auth): add multi-provider login UI and mandatory subdomain onboarding gate"
```

---

### Task 3: Persistent Profile & Article Storage Layers

**Files:**
- Create: `src/lib/profile-storage.ts`
- Create: `src/lib/article-storage.ts`
- Modify: `src/app/actions/tenant.ts`

**Interfaces:**
- Produces:
  - `getProfileByUsername(username: string): Promise<Profile | null>`
  - `updateProfile(userId: string, data: UpdateProfileInput): Promise<Profile>`
  - `getArticlesByUsername(username: string): Promise<Article[]>`
  - `getArticleBySlug(username: string, slug: string): Promise<Article | null>`
  - `publishTenantArticle(input: PublishArticleInput): Promise<PublishArticleResult>` (now persisting to Supabase `articles` with Litera integration).

- [ ] **Step 1: Implement `src/lib/profile-storage.ts`**
Fetch creator profile details, stats (followers count, following count, articles count), and handle profile updates.

- [ ] **Step 2: Implement `src/lib/article-storage.ts`**
Query articles by author username, query single article by slug, and handle database inserts. Keep fallback to `DEFAULT_TENANT_ARTICLES` if database is unseeded.

- [ ] **Step 3: Update `src/app/actions/tenant.ts` to write to Supabase `articles`**
Extract authenticated user session from `createClient()`. Enforce that only the creator owning the username can publish to that subdomain.

- [ ] **Step 4: Verify build & lint**
Run: `npm run lint && npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/lib/profile-storage.ts src/lib/article-storage.ts src/app/actions/tenant.ts
git commit -m "feat(storage): implement persistent profile and article storage with author authorization"
```

---

### Task 4: Medium-Style Creator Profile Page Overhaul

**Files:**
- Create: `src/app/tenant/[username]/components/ProfileBanner.tsx`
- Create: `src/app/tenant/[username]/components/ProfileTabs.tsx`
- Create: `src/app/tenant/[username]/components/EditProfileModal.tsx`
- Modify: `src/app/tenant/[username]/page.tsx`

**Interfaces:**
- Consumes: `getProfileByUsername`, `getArticlesByUsername`.
- Produces: Full Medium-style layout (Banner Cover, Circular Avatar, Bio, Follow button, Articles Feed, Litera NFT Certificates tab).

- [ ] **Step 1: Create `ProfileBanner.tsx`**
Responsive wide cover header with gradient fallback, circular avatar, creator display name, verified subdomain pill, bio, and social links.

- [ ] **Step 2: Create `ProfileTabs.tsx`**
Tab navigation: "Refleksi & Tulisan", "Sertifikat Digital Litera NFT", and "Tentang Penulis".

- [ ] **Step 3: Create `EditProfileModal.tsx`**
Drawer/modal allowing the creator to update Display Name, Bio, Avatar URL, Banner URL, and external links.

- [ ] **Step 4: Update `src/app/tenant/[username]/page.tsx`**
Integrate `ProfileBanner`, `ProfileTabs`, and `EditProfileModal`, passing down active user session info to conditionally show "Edit Profil" vs "Follow".

- [ ] **Step 5: Verify build & lint**
Run: `npm run lint && npx tsc --noEmit && npx next build`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/app/tenant/\[username\]/
git commit -m "feat(profile): overhaul creator subdomain page to Medium-style profile layout"
```

---

### Task 5: Social Engagement: Follow System, Facebook Share & Comments

**Files:**
- Create: `src/lib/comment-storage.ts`
- Create: `src/app/actions/community.ts`
- Create: `src/app/tenant/[username]/components/FollowButton.tsx`
- Create: `src/app/tenant/[username]/components/SocialShareBar.tsx`
- Create: `src/app/tenant/[username]/components/CommentSection.tsx`
- Modify: `src/app/tenant/[username]/[slug]/page.tsx`

**Interfaces:**
- Produces:
  - `toggleFollowAction(targetUserId: string): Promise<{ isFollowing: boolean }>`
  - `postCommentAction(articleId: string, content: string, parentId?: string): Promise<Comment>`
  - `deleteCommentAction(commentId: string): Promise<void>`

- [ ] **Step 1: Implement `src/lib/comment-storage.ts` & `src/app/actions/community.ts`**
Queries and server actions for follows, follow counts, comments list with author metadata, and comment posting.

- [ ] **Step 2: Create `FollowButton.tsx`**
Optimistic toggle button with follower count update and login prompt for unauthenticated visitors.

- [ ] **Step 3: Create `SocialShareBar.tsx`**
Floating/inline share bar with one-click Facebook Share Dialog, WhatsApp, Copy Link with toast, and X/Twitter.

- [ ] **Step 4: Create `CommentSection.tsx`**
Clean reflection comments list with author highlight badge ("Author"), timestamp formatting, and authenticated input box.

- [ ] **Step 5: Integrate into `src/app/tenant/[username]/[slug]/page.tsx`**
Position `SocialShareBar` and `CommentSection` below the article content and Litera NFT certificate widget.

- [ ] **Step 6: Verify build & lint**
Run: `npm run lint && npx tsc --noEmit && npx next build`
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit**
```bash
git add src/lib/comment-storage.ts src/app/actions/community.ts src/app/tenant/\[username\]/components/ src/app/tenant/\[username\]/\[slug\]/page.tsx
git commit -m "feat(community): add follow system, social share bar, and reflection comment section"
```

---

### Task 6: Studio Web Builder Authentication Gate & Post-Publish Facebook Share

**Files:**
- Modify: `src/app/builder/WebBuilderClient.tsx`
- Modify: `src/components/landing/LandingPage.tsx`
- Modify: `scripts/test-middleware.sh`

**Interfaces:**
- Enforces: Only logged-in users with a verified profile can access Web Builder controls and publish to their subdomain.

- [ ] **Step 1: Update `WebBuilderClient.tsx` with Auth Guard**
Check Supabase user session on mount. If unauthenticated, display an inline friendly card: *"Masuk untuk Mulai Menulis"* with Google, Facebook, and Email sign-in options.

- [ ] **Step 2: Add Post-Publish Facebook Share Modal in `WebBuilderClient.tsx`**
When publishing succeeds, trigger a success modal with celebration animation, live article link, and direct CTA: **"Bagikan ke Facebook"**.

- [ ] **Step 3: Update `LandingPage.tsx` Navigation Links**
Replace dead `/login` ("Masuk Admin") link with dynamic **"Masuk / Daftar"** button (or user avatar if logged in) and point writing CTAs directly to `/builder`.

- [ ] **Step 4: Update and execute blackbox test suite**
Run: `BASE=http://localhost:3111 ./scripts/test-middleware.sh`
Ensure all 25+ routing and redirect assertions remain green.

- [ ] **Step 5: Full production build check**
Run: `npm run lint && npx tsc --noEmit && npx next build`
Expected: PASS with exit code 0.

- [ ] **Step 6: Commit**
```bash
git add src/app/builder/ src/components/landing/ scripts/test-middleware.sh
git commit -m "feat(builder): gate builder to authenticated creators and add post-publish Facebook share modal"
```

---

### Task 7: End-to-End Verification & Environment Variables Documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Test: Full manual and script verification across subdomains and auth flows

- [ ] **Step 1: Update `.env.example`**
Add Supabase environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 2: Run full regression and type checks**
Run: `npm run lint && npx tsc --noEmit && npx next build`

- [ ] **Step 3: Commit and finalize plan**
```bash
git add .env.example README.md
git commit -m "docs: document Supabase auth and storage environment variables"
```
