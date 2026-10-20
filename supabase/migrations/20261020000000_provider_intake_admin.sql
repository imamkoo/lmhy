-- Supabase Schema Migration: Provider intake, documents, and admin audit log
-- Date: 2026-10-20

CREATE TABLE IF NOT EXISTS public.provider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', username TEXT NOT NULL, applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL, whatsapp TEXT NOT NULL, domicile_province TEXT NOT NULL, domicile_city TEXT NOT NULL,
  motivation TEXT NOT NULL, background_track TEXT, pfa_status TEXT NOT NULL DEFAULT 'BELUM', pfa_evidence_doc_id UUID,
  wa_joined_confirmed_at TIMESTAMPTZ, ethics_pledge_at TIMESTAMPTZ NOT NULL, pledge_version TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ, applied_at TIMESTAMPTZ DEFAULT NOW(), decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, decision_note TEXT,
  supersedes UUID, superseded_by UUID, details JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT provider_applications_track_check CHECK (track IN ('SEBAYA','KLINIS')),
  CONSTRAINT provider_applications_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED','SUPERSEDED')),
  CONSTRAINT provider_applications_background_check CHECK (background_track IS NULL OR background_track IN ('PENYINTAS','PEMERHATI','MAHASISWA','LAINNYA')),
  CONSTRAINT provider_applications_pfa_check CHECK (pfa_status IN ('BELUM','SEDANG','SELESAI')),
  CONSTRAINT provider_applications_details_check CHECK ((track = 'KLINIS' AND details ?& ARRAY['academic_title','s2_campus','s2_graduation_year','specialization','str_number','sip_status','current_practice','years_experience','flight_hours','modalities']) OR (track = 'SEBAYA' AND details ?& ARRAY['background_track','personal_experience','availability']))
);

CREATE TABLE IF NOT EXISTS public.provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), application_id UUID NOT NULL REFERENCES public.provider_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, doc_type TEXT NOT NULL, storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL, mime_type TEXT NOT NULL, size_bytes BIGINT NOT NULL, uploaded_at TIMESTAMPTZ DEFAULT NOW(), purge_after TIMESTAMPTZ,
  CONSTRAINT provider_documents_type_check CHECK (doc_type IN ('STR','SIPP','CV','TRAINING_CERT','PFA_CERT','OTHER')),
  CONSTRAINT provider_documents_size_check CHECK (size_bytes > 0)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_applications_pfa_evidence_fkey') THEN ALTER TABLE public.provider_applications ADD CONSTRAINT provider_applications_pfa_evidence_fkey FOREIGN KEY (pfa_evidence_doc_id) REFERENCES public.provider_documents(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_applications_supersedes_fkey') THEN ALTER TABLE public.provider_applications ADD CONSTRAINT provider_applications_supersedes_fkey FOREIGN KEY (supersedes) REFERENCES public.provider_applications(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_applications_superseded_by_fkey') THEN ALTER TABLE public.provider_applications ADD CONSTRAINT provider_applications_superseded_by_fkey FOREIGN KEY (superseded_by) REFERENCES public.provider_applications(id) ON DELETE SET NULL; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT, note TEXT, metadata JSONB, created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT admin_audit_log_action_check CHECK (action IN ('APPLICATION_APPROVED','APPLICATION_REJECTED','APPLICATION_EXPIRED','APPLICATION_RESUBMITTED','DOCUMENT_VIEWED','CHECKLIST_UPDATED','LITERA_CONFIG_UPDATED','EMAIL_RESENT','SWEEP_FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_provider_applications_queue ON public.provider_applications(status, track, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_applications_user ON public.provider_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_application ON public.provider_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_purge ON public.provider_documents(purge_after);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON public.admin_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.provider_applications, public.provider_documents, public.admin_audit_log TO service_role;
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-credentials', 'provider-credentials', false) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.release_mitra_username(target_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_username text;
BEGIN
  SELECT username INTO current_username FROM public.profiles WHERE id = target_user_id;
  IF current_username IS NOT NULL AND current_username LIKE 'akun-%' THEN RETURN; END IF;
  UPDATE public.profiles SET username = 'akun-' || substr(replace(target_user_id::text, '-', ''), 1, 8), updated_at = now() WHERE id = target_user_id;
END;
$$;
