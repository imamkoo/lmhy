-- Supabase SQL Editor — Seed QA users TANPA OTP (langsung siap login)
-- Project: Let Me Hear You (FREE)
-- Cara pakai: buka Supabase Dashboard → SQL Editor → New query → paste file ini → Run

-- ==============================================================================
-- DAFTAR USER QA (password default: qa123456 — ganti jika mau)
-- - Praktisi terverifikasi: qa.praktisi.01@gmail.com / qa123456
-- - Pendamping pending (untuk uji akses ditolak): qa.pendamping.pending@gmail.com / qa123456
-- - Klien: qa.klien.01@gmail.com / qa123456
-- Ketiga akun sudah email_confirmed + confirmed_at terisi → login langsung tanpa OTP
-- ==============================================================================

-- Catatan: user dibuat via Dashboard → Authentication → Users → Add user
-- (centang "Auto Confirm" → password qa123456) sehingga tidak perlu OTP.
-- Alternatif via Admin API (service_role):
--   curl -X POST 'https://<project>.supabase.co/auth/v1/admin/users' \
--     -H 'apikey: <service_role_key>' -H 'Authorization: Bearer <service_role_key>' \
--     -H 'Content-Type: application/json' \
--     -d '{"email":"qa.praktisi.01@gmail.com","password":"qa123456","email_confirm":true}'

-- 2) Isi / update profiles + slot untuk masing-masing role
-- Praktisi: APPROVED + KLINIS (sudah ada di seed sebelumnya, gabung di sini idempoten)
DO $$
DECLARE
  praktisi_id uuid; praktisi_username text;
  pendamping_pending_id uuid; pendamping_username text;
  klien_id uuid; klien_username text;
BEGIN
  SELECT id INTO praktisi_id FROM auth.users WHERE email='qa.praktisi.01@gmail.com' LIMIT 1;
  SELECT id INTO pendamping_pending_id FROM auth.users WHERE email='qa.pendamping.pending@gmail.com' LIMIT 1;
  SELECT id INTO klien_id FROM auth.users WHERE email='qa.klien.01@gmail.com' LIMIT 1;

  IF praktisi_id IS NOT NULL THEN
    SELECT username INTO praktisi_username FROM public.profiles WHERE id=praktisi_id;
    IF praktisi_username IS NULL THEN
      praktisi_username := 'praktisiqa';
    END IF;
    INSERT INTO public.profiles (id, username, display_name, bio, creator_role, verification_status, service_track, verified_at)
    VALUES (
      praktisi_id, praktisi_username, 'Ruang Konseling Pratama',
      'Praktisi kesehatan mental terverifikasi. Mendampingi perjalanan konseling dengan pendekatan klinis yang aman dan beretika.',
      'PRAKTISI','APPROVED','KLINIS', now()
    ) ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      bio = COALESCE(public.profiles.bio, EXCLUDED.bio),
      creator_role='PRAKTISI', verification_status='APPROVED', service_track='KLINIS', verified_at=now();

    -- Slot Praktisi (3 slot minggu depan) bila belum ada
    INSERT INTO public.listening_slots (provider_id, start_time, duration_min, price_idr, status)
    SELECT praktisi_id, ts, 60, p, 'AVAILABLE'
    FROM (VALUES (now()+interval '3 days'+time '19:00',99000),(now()+interval '4 days'+time '10:00',99000),(now()+interval '5 days'+time '15:00',75000)) AS v(ts,p)
    WHERE NOT EXISTS (SELECT 1 FROM public.listening_slots WHERE provider_id=praktisi_id AND status='AVAILABLE');
  END IF;

  IF pendamping_pending_id IS NOT NULL THEN
    SELECT username INTO pendamping_username FROM public.profiles WHERE id=pendamping_pending_id;
    IF pendamping_username IS NULL THEN
      pendamping_username := 'pendampingpending';
    END IF;
    INSERT INTO public.profiles (id, username, display_name, bio, creator_role, verification_status, service_track)
    VALUES (
      pendamping_pending_id, pendamping_username, 'Teman Dengar Budi',
      'Pendamping sebaya dalam proses verifikasi.',
      'PENDAMPING','PENDING','SEBAYA'
    ) ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      creator_role='PENDAMPING', verification_status='PENDING', service_track='SEBAYA', verified_at=NULL;
  END IF;

  IF klien_id IS NOT NULL THEN
    SELECT username INTO klien_username FROM public.profiles WHERE id=klien_id;
    IF klien_username IS NULL THEN
      klien_username := 'klienqa';
    END IF;
    INSERT INTO public.profiles (id, username, display_name, bio, creator_role, verification_status, service_track)
    VALUES (
      klien_id, klien_username, 'Klien QA',
      'Akun uji klien untuk booking.',
      'PENULIS','NONE',NULL
    ) ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username;
  END IF;

  RAISE NOTICE 'Seed QA users selesai (praktisi %, pendamping %, klien %).', praktisi_id, pendamping_pending_id, klien_id;
END $$;

-- 3) Verifikasi akhir — hasilnya harus muncul 3 user + role + slot
SELECT au.email, au.email_confirmed_at, au.confirmed_at, p.username, p.creator_role, p.verification_status, p.service_track
FROM auth.users au LEFT JOIN public.profiles p ON p.id=au.id
WHERE au.email IN ('qa.praktisi.01@gmail.com','qa.pendamping.pending@gmail.com','qa.klien.01@gmail.com')
ORDER BY au.email;

SELECT p.username, p.creator_role, ls.id, ls.start_time, ls.duration_min, ls.price_idr, ls.status
FROM public.profiles p
JOIN public.listening_slots ls ON ls.provider_id=p.id
WHERE p.id IN (SELECT id FROM auth.users WHERE email IN ('qa.praktisi.01@gmail.com','qa.pendamping.pending@gmail.com'))
ORDER BY p.username, ls.start_time;

-- Semua akun: password qa123456 (via Add user → Auto Confirm).
