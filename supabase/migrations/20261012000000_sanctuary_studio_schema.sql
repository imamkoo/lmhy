-- Sanctuary Studio schema migration
-- Date: 2026-10-12
-- Additive only: adds new tables, new profiles columns, indexes, and RLS policies.

CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'SAPA' CHECK (tier IN ('SAPA','CERITA','DENGAR')),
  current_period_end timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id)
);

CREATE TABLE IF NOT EXISTS public.listening_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min BETWEEN 15 AND 120),
  price_idr bigint NOT NULL CHECK (price_idr >= 0),
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','RESERVED','BOOKED','CANCELLED','COMPLETED')),
  reserved_until timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.listening_slots(id) ON DELETE CASCADE,
  client_pseudonym text NOT NULL,
  client_contact text NOT NULL,
  client_note text,
  consent_accepted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','CONFIRMED','COMPLETED','CANCELLED','REFUNDED','NO_SHOW')),
  order_id text UNIQUE,
  midtrans_transaction_id text,
  room_url text,
  take_rate_bps integer NOT NULL CHECK (take_rate_bps BETWEEN 500 AND 10000),
  amount_idr bigint NOT NULL,
  risk_flag text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guided_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  prompt_body text NOT NULL,
  category text NOT NULL CHECK (category IN ('Burnout','Duka','Penerimaan Diri','Hubungan','Kecemasan')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_role text NOT NULL DEFAULT 'PENULIS' CHECK (creator_role IN ('PENULIS','PENDAMPING','PRAKTISI')),
  ADD COLUMN IF NOT EXISTS service_track text CHECK (service_track IN ('SEBAYA','KLINIS')),
  ADD COLUMN IF NOT EXISTS credential_type text,
  ADD COLUMN IF NOT EXISTS credential_number text,
  ADD COLUMN IF NOT EXISTS credential_document_url text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'NONE' CHECK (verification_status IN ('NONE','PENDING','APPROVED','REJECTED')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verification_note text,
  ADD COLUMN IF NOT EXISTS pro_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_listening_slots_provider ON public.listening_slots(provider_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_slot ON public.session_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_guided_prompts_category ON public.guided_prompts(category);
CREATE INDEX IF NOT EXISTS idx_profiles_creator_role ON public.profiles(creator_role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_prompts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guided_prompts' AND policyname = 'Guided prompts are viewable by everyone') THEN
    CREATE POLICY "Guided prompts are viewable by everyone"
      ON public.guided_prompts FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listening_slots' AND policyname = 'Listening slots are viewable by everyone') THEN
    CREATE POLICY "Listening slots are viewable by everyone"
      ON public.listening_slots FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listening_slots' AND policyname = 'Providers can insert their own listening slots') THEN
    CREATE POLICY "Providers can insert their own listening slots"
      ON public.listening_slots FOR INSERT
      WITH CHECK (auth.uid() = provider_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listening_slots' AND policyname = 'Providers can update their own listening slots') THEN
    CREATE POLICY "Providers can update their own listening slots"
      ON public.listening_slots FOR UPDATE
      USING (auth.uid() = provider_id)
      WITH CHECK (auth.uid() = provider_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listening_slots' AND policyname = 'Providers can delete their own listening slots') THEN
    CREATE POLICY "Providers can delete their own listening slots"
      ON public.listening_slots FOR DELETE
      USING (auth.uid() = provider_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_bookings' AND policyname = 'Authenticated users can create bookings') THEN
    CREATE POLICY "Authenticated users can create bookings"
      ON public.session_bookings FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_bookings' AND policyname = 'Providers can view bookings for their own slots') THEN
    CREATE POLICY "Providers can view bookings for their own slots"
      ON public.session_bookings FOR SELECT
      USING (auth.uid() = (SELECT sl.provider_id FROM public.listening_slots sl WHERE sl.id = session_bookings.slot_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_bookings' AND policyname = 'Service role manages bookings') THEN
    CREATE POLICY "Service role manages bookings"
      ON public.session_bookings FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creator_subscriptions' AND policyname = 'Providers can view their own subscription') THEN
    CREATE POLICY "Providers can view their own subscription"
      ON public.creator_subscriptions FOR SELECT
      USING (auth.uid() = provider_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creator_subscriptions' AND policyname = 'Service role manages subscriptions') THEN
    CREATE POLICY "Service role manages subscriptions"
      ON public.creator_subscriptions FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
