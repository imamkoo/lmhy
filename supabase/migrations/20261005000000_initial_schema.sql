-- Supabase Schema Migration: Initial Schema for LMHY Creator Auth, Profiles, Articles, Follows, and Comments
-- Date: 2026-10-05

-- 1. Profiles (extending auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'safe_username'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT safe_username CHECK (username ~* '^[a-z0-9-]+$');
  END IF;
END $$;

-- 2. Articles (Persistent Tenant Articles)
CREATE TABLE IF NOT EXISTS public.articles (
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
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 4. Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_username ON public.articles(username);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- RLS Policies: Articles
DROP POLICY IF EXISTS "Articles are viewable by everyone" ON public.articles;
CREATE POLICY "Articles are viewable by everyone" 
  ON public.articles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authors can insert their own articles" ON public.articles;
CREATE POLICY "Authors can insert their own articles" 
  ON public.articles FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own articles" ON public.articles;
CREATE POLICY "Authors can update their own articles" 
  ON public.articles FOR UPDATE 
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own articles" ON public.articles;
CREATE POLICY "Authors can delete their own articles" 
  ON public.articles FOR DELETE 
  USING (auth.uid() = author_id);

-- RLS Policies: Follows
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" 
  ON public.follows FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can follow" ON public.follows;
CREATE POLICY "Users can follow" 
  ON public.follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" 
  ON public.follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- RLS Policies: Comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments" 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own comments" ON public.comments;
CREATE POLICY "Authors can update their own comments" 
  ON public.comments FOR UPDATE 
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own comments" ON public.comments;
CREATE POLICY "Authors can delete their own comments" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = author_id);
