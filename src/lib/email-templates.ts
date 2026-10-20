export interface TemplateArgs {
  applicantName: string;
  username: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const DEFAULT_BASE_URL = "https://www.letmehearyou.id";

export function baseUrl(): string {
  const raw = process.env.APP_URL?.trim();
  if (!raw) return DEFAULT_BASE_URL;
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BASE_WRAPPER = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:24px;background-color:#FBF8F5;font-family:'Poppins', Arial, sans-serif;color:#3C3163;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;border:1px solid rgba(60,49,99,0.08);overflow:hidden;">
    <tr>
      <td style="padding:32px 32px 16px 32px;text-align:center;">
        <h1 style="margin:0;font-size:20px;font-weight:800;color:#3C3163;letter-spacing:-0.5px;">Let Me Hear You</h1>
        <p style="margin:4px 0 0 0;font-size:12px;color:#3C3163;opacity:0.6;">Sanctuary &amp; Mitra Community</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 32px 32px;font-size:14px;line-height:1.6;color:#3C3163;">
        ${bodyContent}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;background:#FBF8F5;border-top:1px solid rgba(60,49,99,0.06);text-align:center;font-size:11px;color:#3C3163;opacity:0.6;">
        <p style="margin:0;">Email ini dikirim otomatis oleh sistem Let Me Hear You.</p>
        <p style="margin:4px 0 0 0;">&copy; 2026 Let Me Hear You. Hak cipta dilindungi undang-undang.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export function applicationReceivedTemplate(args: TemplateArgs): EmailContent {
  const subject = `Pengajuan Kemitraan LMHY Diterima — ${args.applicantName}`;
  const text = `Halo ${args.applicantName},\n\nTerima kasih telah mengajukan diri sebagai mitra di Let Me Hear You (@${args.username}). Berkas dan data Anda telah kami terima dan saat ini sedang dalam antrean verifikasi tim kami.\n\nAnda dapat memantau status pengajuan melalui area akun Anda di LMHY.\n\nSalam hangat,\nTim Let Me Hear You`;
  const html = BASE_WRAPPER(
    subject,
    `
    <h2 style="margin:0 0 16px 0;font-size:18px;color:#3C3163;">Pengajuan Kemitraan Anda Diterima</h2>
    <p>Halo <strong>${escapeHtml(args.applicantName)}</strong>,</p>
    <p>Terima kasih telah mengajukan diri sebagai mitra di <strong>Let Me Hear You</strong> dengan akun <code>@${escapeHtml(args.username)}</code>.</p>
    <p>Berkas dan informasi yang Anda lampirkan telah masuk ke antrean verifikasi tim kami. Kami akan meninjau kelengkapan kredensial dan komitmen etika Anda secara seksama.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${baseUrl()}/akun/pengajuan" style="background:#F7ABC5;color:#3C3163;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;font-size:13px;">Pantau Status Pengajuan</a>
    </div>
    <p style="margin-top:24px;">Salam hangat,<br><strong>Tim Let Me Hear You</strong></p>
    `
  );
  return { subject, html, text };
}

export function applicationApprovedTemplate(
  args: TemplateArgs & { roleLabel: string }
): EmailContent {
  const subject = `Selamat! Pengajuan Kemitraan Disetujui — ${args.applicantName}`;
  const text = `Halo ${args.applicantName},\n\nKabar baik! Pengajuan Anda sebagai ${args.roleLabel} di Let Me Hear You (@${args.username}) telah disetujui.\n\nAkun Anda kini telah aktif dengan akses mitra. Anda dapat masuk dan mulai mengatur jadwal serta profil praktik Anda.\n\nSelamat datang di ekosistem LMHY!`;
  const html = BASE_WRAPPER(
    subject,
    `
    <h2 style="margin:0 0 16px 0;font-size:18px;color:#3C3163;">Selamat! Pengajuan Anda Disetujui</h2>
    <p>Halo <strong>${escapeHtml(args.applicantName)}</strong>,</p>
    <p>Kami sangat senang mengabarkan bahwa pengajuan Anda sebagai <strong>${escapeHtml(args.roleLabel)}</strong> dengan akun <code>@${escapeHtml(args.username)}</code> telah resmi disetujui oleh tim verifikasi kami.</p>
    <div style="margin:20px 0;padding:16px;background:#FBF8F5;border-radius:16px;border-left:4px solid #F7ABC5;">
      <p style="margin:0;font-size:13px;font-weight:600;">Status Anda: <span style="color:#059669;">${escapeHtml(args.roleLabel)}</span></p>
    </div>
    <p>Anda kini memiliki hak penuh untuk mengelola sesi pendampingan/konseling dan membangun ruang aman bagi mereka yang membutuhkan.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${baseUrl()}/akun?tab=pengajuan" style="background:#F7ABC5;color:#3C3163;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;font-size:13px;">Lihat Status Pengajuan</a>
    </div>
    <p style="margin-top:24px;">Salam hangat,<br><strong>Tim Let Me Hear You</strong></p>
    `
  );
  return { subject, html, text };
}

export function applicationRejectedTemplate(
  args: TemplateArgs & { note: string }
): EmailContent {
  const subject = `Pemberitahuan Status Pengajuan Kemitraan — ${args.applicantName}`;
  const text = `Halo ${args.applicantName},\n\nTerima kasih atas minat Anda bergabung sebagai mitra LMHY (@${args.username}).\n\nSetelah peninjauan, tim kami belum dapat menyetujui pengajuan Anda saat ini karena alasan berikut:\n${args.note}\n\nAnda dapat memperbaiki data atau melengkapi dokumen yang diminta lalu mengajukan ulang melalui area akun Anda.\n\nSalam hangat,\nTim Let Me Hear You`;
  const html = BASE_WRAPPER(
    subject,
    `
    <h2 style="margin:0 0 16px 0;font-size:18px;color:#3C3163;">Pemberitahuan Pengajuan Kemitraan</h2>
    <p>Halo <strong>${escapeHtml(args.applicantName)}</strong>,</p>
    <p>Terima kasih atas antusiasme Anda untuk bergabung sebagai mitra di <strong>Let Me Hear You</strong> (<code>@${escapeHtml(args.username)}</code>).</p>
    <p>Setelah dilakukan peninjauan kredensial, tim verifikasi kami mencatat beberapa hal yang belum memenuhi kriteria kelayakan saat ini:</p>
    <div style="margin:20px 0;padding:16px;background:#FBF8F5;border-radius:16px;border-left:4px solid #E11D48;font-size:13px;">
      <strong>Catatan Verifikator:</strong><br>
      <p style="margin:8px 0 0 0;white-space:pre-wrap;">${escapeHtml(args.note)}</p>
    </div>
    <p>Jangan berkecil hati. Anda dapat memperbaiki data atau berkas dokumen tersebut, lalu mengajukan permohonan kembali melalui tautan di bawah ini:</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${baseUrl()}/akun/pengajuan" style="background:#F7ABC5;color:#3C3163;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;font-size:13px;">Perbaiki &amp; Ajukan Ulang</a>
    </div>
    <p style="margin-top:24px;">Salam hangat,<br><strong>Tim Let Me Hear You</strong></p>
    `
  );
  return { subject, html, text };
}

export function applicationExpiredTemplate(args: TemplateArgs): EmailContent {
  const subject = `Pengajuan Kemitraan Kedaluwarsa — ${args.applicantName}`;
  const text = `Halo ${args.applicantName},\n\nPengajuan kemitraan Anda di Let Me Hear You (@${args.username}) telah kedaluwarsa karena tidak ada aktivitas atau verifikasi email dalam batas waktu yang ditentukan.\n\nUsername tersebut kini telah dilepas kembali ke publik. Anda tetap dapat mendaftar ulang kapan saja melalui portal kemitraan kami.\n\nSalam hangat,\nTim Let Me Hear You`;
  const html = BASE_WRAPPER(
    subject,
    `
    <h2 style="margin:0 0 16px 0;font-size:18px;color:#3C3163;">Pengajuan Kemitraan Kedaluwarsa</h2>
    <p>Halo <strong>${escapeHtml(args.applicantName)}</strong>,</p>
    <p>Pengajuan kemitraan Anda dengan akun <code>@${escapeHtml(args.username)}</code> telah melewati batas waktu toleransi verifikasi (TTL) dan kini berstatus kedaluwarsa.</p>
    <p>Sesuai kebijakan platform kami, reservasi username yang belum terverifikasi telah dilepas kembali agar tersedia untuk komunitas.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${baseUrl()}/mitra" style="background:#F7ABC5;color:#3C3163;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;font-size:13px;">Daftar Kembali</a>
    </div>
    <p style="margin-top:24px;">Salam hangat,<br><strong>Tim Let Me Hear You</strong></p>
    `
  );
  return { subject, html, text };
}

export function emailVerificationTemplate(
  args: TemplateArgs & { verificationUrl: string }
): EmailContent {
  const subject = `Verifikasi Email Pengajuan Kemitraan LMHY — ${args.applicantName}`;
  const text = `Halo ${args.applicantName},\n\nTerima kasih telah mengajukan diri sebagai mitra di Let Me Hear You (@${args.username}).\n\nSatu langkah lagi: verifikasi alamat email Anda melalui tautan berikut.\n\n${args.verificationUrl}\n\nPengajuan tanpa verifikasi email akan kedaluwarsa otomatis dalam 7 hari sejak pendaftaran.\n\nSalam hangat,\nTim Let Me Hear You`;
  const html = BASE_WRAPPER(
    subject,
    `
    <h2 style="margin:0 0 16px 0;font-size:18px;color:#3C3163;">Satu Langkah Lagi: Verifikasi Email</h2>
    <p>Halo <strong>${escapeHtml(args.applicantName)}</strong>,</p>
    <p>Terima kasih telah mengajukan diri sebagai mitra di <strong>Let Me Hear You</strong> dengan akun <code>@${escapeHtml(args.username)}</code>.</p>
    <p>Klik tombol di bawah untuk memverifikasi alamat email Anda. Verifikasi wajib diselesaikan agar pengajuan Anda dapat ditinjau tim kami.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${escapeHtml(args.verificationUrl)}" style="background:#F7ABC5;color:#3C3163;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;font-size:13px;">Verifikasi Email Saya</a>
    </div>
    <p style="font-size:12px;opacity:0.7;">Tautan ini hanya berlaku sekali. Pengajuan yang belum diverifikasi setelah 7 hari akan kedaluwarsa secara otomatis.</p>
    <p style="margin-top:24px;">Salam hangat,<br><strong>Tim Let Me Hear You</strong></p>
    `
  );
  return { subject, html, text };
}

export function applicationSupersededTemplate(args: TemplateArgs): EmailContent {
  const subject = `Pengajuan Sebelumnya Digantikan — ${args.applicantName}`;
  const text = `Halo ${args.applicantName},\n\nPengajuan kemitraan Anda di Let Me Hear You (@${args.username}) telah digantikan oleh pengajuan yang lebih baru dan sudah disetujui tim verifikasi kami. Tidak ada tindakan lanjutan yang perlu Anda lakukan.\n\nSalam hangat,\nTim Let Me Hear You`;
  const html = BASE_WRAPPER(
    subject,
    `
    <h2 style="margin:0 0 16px 0;font-size:18px;color:#3C3163;">Pengajuan Lama Digantikan</h2>
    <p>Halo <strong>${escapeHtml(args.applicantName)}</strong>,</p>
    <p>Pengajuan kemitraan Anda dengan akun <code>@${escapeHtml(args.username)}</code> telah digantikan oleh pengajuan yang lebih baru.</p>
    <p>Pengajuan terbaru Anda sudah disetujui oleh tim verifikasi. Tidak ada tindakan lanjutan yang perlu Anda lakukan.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${baseUrl()}/akun?tab=pengajuan" style="background:#F7ABC5;color:#3C3163;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;font-size:13px;">Lihat Riwayat Pengajuan</a>
    </div>
    <p style="margin-top:24px;">Salam hangat,<br><strong>Tim Let Me Hear You</strong></p>
    `
  );
  return { subject, html, text };
}
