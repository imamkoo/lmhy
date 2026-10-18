-- Sanctuary Studio remedial migration: unify to Indonesian taxonomy + flat 10% take rate
-- Date: 2026-10-13
-- Idempotent: safe whether base migration ran with old or new constraints, or not at all.
-- Spec: docs/superpowers/specs/2026-10-13-lmhy-sanctuary-studio-unified-spec.md section 6

-- 1. Pastikan tabel creator_subscriptions mendukung tier baru
ALTER TABLE public.creator_subscriptions DROP CONSTRAINT IF EXISTS creator_subscriptions_tier_check;
ALTER TABLE public.creator_subscriptions ALTER COLUMN tier SET DEFAULT 'SAPA';

UPDATE public.creator_subscriptions SET tier = 'SAPA' WHERE tier = 'FREE';
UPDATE public.creator_subscriptions SET tier = 'CERITA' WHERE tier = 'PRO';

ALTER TABLE public.creator_subscriptions ADD CONSTRAINT creator_subscriptions_tier_check
  CHECK (tier IN ('SAPA', 'CERITA', 'DENGAR'));

-- 2. Pastikan profiles mendukung creator_role baru
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_creator_role_check;
ALTER TABLE public.profiles ALTER COLUMN creator_role SET DEFAULT 'PENULIS';

UPDATE public.profiles SET creator_role = 'PENULIS' WHERE creator_role = 'REFLECTOR';
UPDATE public.profiles SET creator_role = 'PENDAMPING' WHERE creator_role = 'COMPANION';
UPDATE public.profiles SET creator_role = 'PRAKTISI' WHERE creator_role = 'PROFESSIONAL';

ALTER TABLE public.profiles ADD CONSTRAINT profiles_creator_role_check
  CHECK (creator_role IN ('PENULIS', 'PENDAMPING', 'PRAKTISI'));

-- 3. Pastikan service_track diperbarui ke istilah Indonesia
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_service_track_check;
UPDATE public.profiles SET service_track = 'SEBAYA' WHERE service_track = 'PEER';
UPDATE public.profiles SET service_track = 'KLINIS' WHERE service_track = 'CLINICAL';

ALTER TABLE public.profiles ADD CONSTRAINT profiles_service_track_check
  CHECK (service_track IN ('SEBAYA', 'KLINIS'));

-- 4. Set take_rate_bps default 1000 (10% flat)
ALTER TABLE public.session_bookings ALTER COLUMN take_rate_bps SET DEFAULT 1000;
