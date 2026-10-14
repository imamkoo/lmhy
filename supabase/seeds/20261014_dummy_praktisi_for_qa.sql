-- Seed dummy PRAKTISI untuk QA A1.5 & A1.6
-- Cara pakai:
-- 1. Daftar 1 akun baru via UI: qa.praktisi.01@gmail.com (atau ganti email di bawah)
-- 2. Jalankan file ini di Supabase SQL Editor
-- 3. Logout → login ulang → buka /tenant/<username-praktisi> untuk verifikasi

-- Pastikan akun ada; jika belum ada, abaikan error dan buat akun via UI dulu
DO $$
DECLARE
  praktisi_id uuid;
  praktisi_username text;
BEGIN
  SELECT id, username INTO praktisi_id, praktisi_username
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE au.email = 'qa.praktisi.01@gmail.com'
  LIMIT 1;

  IF praktisi_id IS NULL THEN
    RAISE NOTICE 'Akun qa.praktisi.01@gmail.com belum ada. Daftar via /login dulu, lalu jalankan seed ini lagi.';
    RETURN;
  END IF;

  UPDATE public.profiles
  SET creator_role = 'PRAKTISI',
      verification_status = 'APPROVED',
      service_track = 'KLINIS',
      verified_at = now(),
      bio = COALESCE(bio, 'Praktisi kesehatan mental terverifikasi. Mendampingi perjalanan konseling dengan pendekatan klinis yang aman dan beretika.'),
      display_name = COALESCE(display_name, 'Ruang Konseling ' || praktisi_username)
  WHERE id = praktisi_id;

  -- Buat 3 slot contoh minggu depan (jika belum ada)
  INSERT INTO public.listening_slots (provider_id, start_time, duration_min, price_idr, status)
  SELECT praktisi_id, ts, 60, price, 'AVAILABLE'
  FROM (VALUES
    (now() + interval '3 days' + time '19:00', 99000),
    (now() + interval '4 days' + time '10:00', 99000),
    (now() + interval '5 days' + time '15:00', 75000)
  ) AS v(ts, price)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.listening_slots ls
    WHERE ls.provider_id = praktisi_id AND ls.status = 'AVAILABLE'
  );

  RAISE NOTICE 'Seed PRAKTISI selesai untuk % (%)', praktisi_username, praktisi_id;
END $$;

-- Verifikasi
SELECT id, username, creator_role, verification_status, service_track
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'qa.praktisi.01@gmail.com');

SELECT id, start_time, duration_min, price_idr, status
FROM public.listening_slots
WHERE provider_id = (SELECT id FROM auth.users WHERE email = 'qa.praktisi.01@gmail.com')
ORDER BY start_time;
