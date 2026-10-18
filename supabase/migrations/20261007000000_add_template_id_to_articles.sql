-- Migration: Add template_id to public.articles table
-- Allows creators to customize visual design presets per article (Warm Sanctuary, Neo-Brutalism, Glassmorphism, Editorial Zen, Midnight Serenity)

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'warm-sanctuary';

-- Backfill legacy records if null
UPDATE public.articles
  SET template_id = 'warm-sanctuary'
  WHERE template_id IS NULL;
