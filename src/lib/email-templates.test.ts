import test from "node:test";
import assert from "node:assert/strict";
import {
  applicationApprovedTemplate,
  applicationExpiredTemplate,
  applicationReceivedTemplate,
  applicationRejectedTemplate,
  applicationSupersededTemplate,
  emailVerificationTemplate,
} from "./email-templates";

test("template approval memuat nama, role, dan username", () => {
  const t = applicationApprovedTemplate({
    applicantName: "Budi",
    roleLabel: "Praktisi Terverifikasi",
    username: "budi",
  });
  assert.ok(t.subject.includes("Budi"));
  assert.ok(t.html.includes("Praktisi Terverifikasi"));
  assert.ok(t.html.includes("budi"));
  assert.ok(t.text.length > 0);
});

test("template penolakan memuat catatan perbaikan", () => {
  const t = applicationRejectedTemplate({
    applicantName: "Budi",
    note: "STR belum aktif di database Kemenkes",
    username: "budi",
  });
  assert.ok(t.html.includes("STR belum aktif"));
  assert.ok(t.text.includes("STR belum aktif"));
});

test("semua template memakai token Warm Sanctuary", () => {
  const templates = [
    applicationReceivedTemplate({ applicantName: "A", username: "a" }),
    applicationApprovedTemplate({ applicantName: "A", roleLabel: "P", username: "a" }),
    applicationRejectedTemplate({ applicantName: "A", note: "x", username: "a" }),
    applicationExpiredTemplate({ applicantName: "A", username: "a" }),
    emailVerificationTemplate({ applicantName: "A", username: "a", verificationUrl: "https://contoh.test/auth/callback?token_hash=t&type=email&next=%2Fakun" }),
    applicationSupersededTemplate({ applicantName: "A", username: "a" }),
  ];

  for (const t of templates) {
    assert.ok(t.html.includes("#FBF8F5"));
    assert.ok(t.html.includes("#3C3163"));
    assert.ok(t.html.includes("Poppins"));
  }
});

function withAppUrl(value: string | undefined, run: () => void) {
  const previous = process.env.APP_URL;
  if (value === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
}

test("tautan email memakai APP_URL dan tidak pernah domain lama", () => {
  withAppUrl("https://contoh.test", () => {
    const templates = [
      applicationReceivedTemplate({ applicantName: "A", username: "a" }),
      applicationApprovedTemplate({ applicantName: "A", roleLabel: "P", username: "a" }),
      applicationRejectedTemplate({ applicantName: "A", note: "x", username: "a" }),
      applicationExpiredTemplate({ applicantName: "A", username: "a" }),
      emailVerificationTemplate({ applicantName: "A", username: "a", verificationUrl: "https://contoh.test/auth/callback?token_hash=t&type=email&next=%2Fakun" }),
      applicationSupersededTemplate({ applicantName: "A", username: "a" }),
    ];

    for (const t of templates) {
      assert.ok(t.html.includes("https://contoh.test/"), "tautan harus relatif ke APP_URL");
      assert.ok(!t.html.includes("letmehearyou.com"), "domain lama tidak boleh muncul");
    }
  });
});

test("tautan email jatuh ke domain produksi saat APP_URL kosong", () => {
  withAppUrl(undefined, () => {
    const t = applicationReceivedTemplate({ applicantName: "A", username: "a" });
    assert.ok(t.html.includes("https://www.letmehearyou.id/akun/pengajuan"));
  });
});

test("template approval tidak menautkan ke rute /praktik yang belum ada", () => {
  const t = applicationApprovedTemplate({ applicantName: "A", roleLabel: "P", username: "a" });
  assert.ok(!t.html.includes("/praktik"));
  assert.ok(t.html.includes("/akun?tab=pengajuan"));
});

test("template approval mengarah ke halaman status pengajuan akun", () => {
  withAppUrl("https://contoh.test", () => {
    const t = applicationApprovedTemplate({ applicantName: "A", roleLabel: "P", username: "a" });
    assert.ok(t.html.includes("https://contoh.test/akun?tab=pengajuan"));
    assert.ok(t.html.includes("Lihat Status Pengajuan"));
  });
});

test("input pengguna di-escape agar tidak bisa menyuntik HTML ke email admin", () => {
  const payload = '<img src=x onerror="alert(1)">';
  const templates = [
    applicationReceivedTemplate({ applicantName: payload, username: "aman" }),
    applicationApprovedTemplate({ applicantName: "A", roleLabel: payload, username: "aman" }),
    applicationRejectedTemplate({ applicantName: payload, note: payload, username: "aman" }),
    applicationExpiredTemplate({ applicantName: payload, username: "aman" }),
    emailVerificationTemplate({ applicantName: payload, username: "aman", verificationUrl: "https://contoh.test/auth/callback?token_hash=t&type=email" }),
    applicationSupersededTemplate({ applicantName: payload, username: "aman" }),
  ];

  for (const t of templates) {
    assert.ok(!t.html.includes("<img src=x"), "tag mentah tidak boleh lolos");
    assert.ok(!t.html.includes('onerror="'), "atribut event tidak boleh lolos");
    assert.ok(t.html.includes("&lt;img src=x"), "harus tampil sebagai teks");
  }

  const rejected = applicationRejectedTemplate({
    applicantName: "A",
    note: payload,
    username: "aman",
  });
  assert.ok(rejected.html.includes("&lt;img src=x"));
  assert.ok(rejected.text.includes(payload), "versi teks biasa tetap apa adanya");
});

test("template verifikasi memuat tautan token_hash yang membawa session", () => {
  const url =
    "https://www.letmehearyou.id/auth/callback?token_hash=abc&type=email&next=%2Fakun";
  const t = emailVerificationTemplate({
    applicantName: "Siti",
    username: "siti",
    verificationUrl: url,
  });
  assert.ok(t.html.includes("token_hash=abc"));
  assert.ok(t.html.includes("/auth/callback"));
  assert.ok(!t.html.includes("/auth/v1/verify"));
  assert.ok(t.text.includes(url));
});

test("tanggal kedaluwarsa dijelaskan di template verifikasi", () => {
  const t = emailVerificationTemplate({
    applicantName: "Siti",
    username: "siti",
    verificationUrl: "https://www.letmehearyou.id/auth/callback?token_hash=abc",
  });
  assert.ok(t.html.includes("7 hari"));
  assert.ok(t.text.includes("7 hari"));
});
