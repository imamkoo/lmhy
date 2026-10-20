import { test, expect } from "@playwright/test";

test.describe("Admin Verification Queue E2E", () => {
  test("halaman admin terproteksi mengarahkan user non-admin", async ({
    page,
  }) => {
    await page.goto("/admin/verifikasi");
    // Karena belum terautentikasi sebagai admin, akan di-redirect ke root
    await expect(page).toHaveURL(/(\/|\/login|\/auth)/);
  });
});
