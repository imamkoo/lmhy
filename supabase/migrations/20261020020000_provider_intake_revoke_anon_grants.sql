-- Perkuat postur deny-all tabel mitra: cabut default privilege Supabase untuk
-- anon/authenticated. Tanpa grant ini, RLS menjadi satu-satunya penahan dan
-- tabel yang berisi PII pelamar (nama, email, WhatsApp, motivasi) bisa bocor
-- bila RLS pernah dimatikan atau ada policy permisif yang tak sengaja dibuat.
--
-- Idempoten: REVOKE pada role yang sudah tidak punya grant tidak error.

REVOKE ALL ON public.provider_applications, public.provider_documents, public.admin_audit_log FROM anon, authenticated;

-- storage.objects dimiliki supabase_storage_admin sehingga role postgres pun
-- tidak boleh ALTER. Di Supabase, RLS storage.objects sudah aktif default.
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'storage.objects: RLS sudah dikelola platform, dilewati';
END;
$$;
