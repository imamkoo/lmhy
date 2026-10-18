# Email Confirm Template — Let Me Hear You (Brevo / Resend)

## Template yang Disarankan

**Subject:**
```
Konfirmasi email Anda — Let Me Hear You
```

**HTML Body (Brevo / Resend):**

```html
<div style="font-family: Poppins, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FBF8F5; color: #3F3766;">
  <h1 style="font-size: 22px; margin: 0 0 8px; font-weight: 700;">Let Me Hear You</h1>
  
  <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
    Halo,<br><br>
    Satu langkah lagi untuk membuka ruang cerita Anda. Konfirmasi email ini supaya akun bisa dipakai dan Anda bisa mengirim refleksi serta mendapatkan sertifikat digital resmi.
  </p>

  <p style="margin: 28px 0 0;">
    <a href="{{ .ConfirmationURL }}"
       style="display: inline-block; background: #F7ABC5; color: #3F3766; font-weight: 700; text-decoration: none; padding: 12px 22px; border-radius: 12px; font-size: 14px;">
      Konfirmasi email
    </a>
  </p>

  <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 32px 0 0;">
    Kalau Anda tidak mendaftar, abaikan email ini.<br>
    Let Me Hear You
  </p>
</div>
```

---

### Cara Pakai di Brevo / Resend

1. Buka Brevo Dashboard → **Transactional Emails** → **Create Transactional Email**
2. Pilih template **"Confirm your email"** atau buat baru
3. Paste HTML di atas (ganti `{{ .ConfirmationURL }}` dengan variabel yang tersedia di Brevo)
4. Simpan

---

### Alternatif: Pakai Resend

```html
<!-- Resend HTML Template -->
<div style="font-family: Poppins, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FBF8F5; color: #3F3766;">
  <h1 style="font-size: 22px; margin: 0 0 8px; font-weight: 700;">Let Me Hear You</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
    Halo,<br><br>
    Satu langkah lagi untuk membuka ruang cerita Anda. Konfirmasi email ini supaya akun bisa dipakai.
  </p>
  <p style="margin: 28px 0 0;">
    <a href="{{ .ConfirmationURL }}"
       style="display: inline-block; background: #F7ABC5; color: #3F3766; font-weight: 700; text-decoration: none; padding: 12px 22px; border-radius: 12px;">
      Konfirmasi email
    </a>
  </p>
  <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 32px 0 0;">
    Kalau Anda tidak mendaftar, abaikan email ini.<br>
    Let Me Hear You
  </p>
</div>
```

---

Mau saya bantu buatkan versi HTML lengkap yang sudah ada copywriting dan warna Let Me Hear You yang lebih lengkap?