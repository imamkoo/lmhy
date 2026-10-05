# Design Specification: Creator Authentication, Medium-style Profiles, and Social Engagement (LMHY)

- **Date:** 2026-10-05
- **Status:** DRAFT (Awaiting User Review)
- **Author:** Antigravity / Engineering Team
- **Harness:** OpenCode / Antigravity
- **Target Repo:** `letmehearyou` (Next.js 16.3.0, React 19.2.4, Tailwind CSS v4)

---

## 1. Executive Summary & Goals

Let Me Hear You (LMHY) is evolving from a single landing-page reflection platform with ephemeral in-memory tenant storage into a fully persistent, community-driven mental health publishing platform. This specification outlines the end-to-end architecture for:
1. **Multi-Provider Authentication:** Email/Password, Google OAuth, and Facebook Login (with Graph API tokens for future cross-posting).
2. **Onboarding Identity Gate:** Mandatory unique username selection that binds a user to their dedicated personal subdomain (e.g., `axaa.letmehearyou.id`).
3. **Medium-Style Creator Profiles:** Wide header banners, circular avatars, bio, social links, publication tabs, and Litera NFT verification badges.
4. **Community Engagement:** Follow/Unfollow system, Social Share tools, and nested reflection comments.
5. **Builder Protection:** Enforcing authenticated author identity when creating and publishing articles to subdomains via `/builder`.

---

## 2. Infrastructure & Scalability Strategy (Supabase)

### Why Supabase?
- **Free Tier Generosity:**
  - 50,000 monthly active users (MAU)
  - 500 MB PostgreSQL database
  - 1 GB file storage (avatars, banners)
  - 5 GB monthly bandwidth
- **Frictionless Scalability (Free to Paid):**
  - Upgrading to the Pro tier ($25/mo) requires zero code refactoring, zero database migration, and no endpoint URL changes.
  - Scale up to 100,000 MAU, 8 GB DB, 100 GB storage with instant point-and-click tier switching.
  - Full PostgreSQL standard with Row Level Security (RLS), ACID compliance, and connection pooling (PgBouncer/Supavisor).

---

## 3. Database Architecture (PostgreSQL Schema)

### 3.1 Tables & Relations

```sql
-- 1. Profiles (extending auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  website TEXT,
  facebook_profile_url TEXT,
  facebook_access_token TEXT, -- Encrypted / service-role only
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: username must be subdomain-safe (alphanumeric and dashes only)
ALTER TABLE public.profiles 
  ADD CONSTRAINT safe_username CHECK (username ~* '^[a-z0-9-]+$');

-- 2. Articles (Persistent Tenant Articles)
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL REFERENCES public.profiles(username) ON UPDATE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY['Refleksi', 'Kesehatan Mental'],
  media_type TEXT CHECK (media_type IN ('IMAGE', 'VIDEO')),
  media_url TEXT,
  register_litera BOOLEAN DEFAULT FALSE,
  creator_wallet TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(username, slug)
);

-- 3. Follows
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 4. Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row Level Security (RLS) Policies
- `profiles`:
  - `SELECT`: Publicly readable by everyone.
  - `INSERT` / `UPDATE`: Only authenticated user can edit their own profile (`auth.uid() = id`).
- `articles`:
  - `SELECT`: Publicly readable.
  - `INSERT` / `UPDATE` / `DELETE`: Only the author (`auth.uid() = author_id`).
- `follows`:
  - `SELECT`: Publicly readable.
  - `INSERT` / `DELETE`: Authenticated user (`auth.uid() = follower_id`).
- `comments`:
  - `SELECT`: Publicly readable.
  - `INSERT`: Any authenticated user.
  - `UPDATE` / `DELETE`: Comment author (`auth.uid() = author_id`).

---

## 4. Authentication & Onboarding Workflow

### 4.1 Login / Registration Modal & Page (`/login`, `/register`)
- Clean, reassuring UI designed for mental wellness (calm warm hues, rounded cards).
- Action buttons:
  - **Continue with Google** (Supabase OAuth)
  - **Continue with Facebook** (Supabase OAuth with `public_profile`, `email`, and `publish_to_groups`/`pages_manage_posts` scopes for future sharing)
  - **Continue with Email** (Password or Magic Link)

### 4.2 Mandatory Subdomain Identity Onboarding Gate
1. After first-time OAuth or email verification, the system detects if `profiles.username` exists.
2. If `profiles.username` is NULL:
   - User is locked to `/onboarding` modal: **"Pilih Subdomain & Nama Pena Anda"**.
   - Input format: `https://[ username ].letmehearyou.id`.
   - Real-time debounced validation checks uniqueness against `public.profiles`.
   - Upon confirmation, profile record is created and user is redirected to their new profile.

---

## 5. Creator Profile Page (Medium-Style UX)

Path: `https://<username>.letmehearyou.id/` (served dynamically via existing subdomain rewrite middleware).

### 5.1 Profile Header
- **Wide Cover Banner (16:9 or 3:1):** Responsive banner with soft fallback gradient if not uploaded.
- **Author Identity:**
  - High-resolution circular avatar (with upload/crop preview in settings).
  - Display Name, Verified Subdomain Badge (`@username`), Bio.
  - Stats: Total Reflections Published, Followers Count, Following Count.
- **Action Bar:**
  - If viewing own profile: **"Edit Profil"** (opens profile drawer/modal) & **"Tulis Refleksi di Builder"**.
  - If viewing another creator's profile: **"Ikuti / Follow"** button, **"Bagikan Profil"** (Copy link, WhatsApp, Facebook, X/Twitter).

### 5.2 Publication Feed & Tabs
- **Tab 1: Refleksi & Cerita:** Clean list/grid of articles with read time, excerpt, cover thumbnail, and tags.
- **Tab 2: Sertifikat Digital (Litera Web3):** Displays badges of on-chain articles registered to Litera Protocol.
- **Tab 3: Tentang Penulis:** Expanded bio, joined date, and social links.

---

## 6. Community Engagement Features

### 6.1 Follow / Unfollow System
- Optimistic UI updates with instant toggle state.
- Server Action handles idempotent insert/delete in `public.follows`.

### 6.2 Article Social Sharing
- Floating / sticky share bar on every article page (`/<slug>`):
  - **Facebook Share Dialog:** One-click share to creator's personal Facebook feed or group.
  - **Copy Link with Toast notification.**
  - **WhatsApp & Telegram Quick Share.**

### 6.3 Reflection Comments Section
- Positioned below the Litera NFT widget at the end of each article.
- Features:
  - Markdown-friendly or clean rich-text textarea.
  - Only authenticated users can submit comments (prompts login modal if unauthenticated).
  - Author badge highlight (comments by `@username` have an "Author" terracotta badge).
  - Timestamp in Indonesian format (e.g., "2 jam yang lalu", "5 Oktober 2026").

---

## 7. Studio Web Builder Integration (`/builder`)

1. **Authentication Guard:**
   - Visiting `/builder` checks for active user session.
   - If not logged in: displays a friendly prompt to sign in with Google, Facebook, or Email.
   - If logged in: automatically binds the article to the authenticated user's confirmed username (preventing impersonation).
2. **Post-Publish Facebook Action:**
   - After successful publishing, an interactive modal appears:
     - *"Artikel Anda berhasil terbit di https://[username].letmehearyou.id/[slug]"*
     - Direct CTA: **"Bagikan ke Facebook Sekarang"** leveraging the saved FB connection.

---

## 8. Verification & Testing Plan

1. **Unit & Integration Tests:**
   - Supabase client initialization & session cookie handling in Next.js Server Components.
   - Username regex sanitizer and duplicate checking.
   - Follow toggle and comment submission Server Actions.
2. **Security & RLS Verification:**
   - Verify unauthenticated users cannot post articles or comments.
   - Verify user A cannot edit or delete user B's profile or articles.
3. **Middleware & Routing Verification:**
   - Validate that `https://<username>.letmehearyou.id` renders the creator's profile.
   - Validate that `/builder` honors the authenticated user session.
   - Ensure zero regressions on existing live redirects and routes.
