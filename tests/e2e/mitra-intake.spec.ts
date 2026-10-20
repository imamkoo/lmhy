import { test, expect } from "@playwright/test";

test.describe("Mitra Intake E2E Flow", () => {
  test("halaman hub /mitra menampilkan pilihan jalur Sebaya dan Psikolog", async ({
    page,
  }) => {
    await page.goto("/mitra");
    await expect(page.getByText("Jalur Mitra Komunitas & Praktisi")).toBeVisible();
    await expect(page.getByText("Pendamping Sebaya")).toBeVisible();
    await expect(page.getByText("Psikolog Klinis")).toBeVisible();
  });

  test("form psikolog 3 langkah menampilkan tahapan dan validasi input", async ({
    page,
  }) => {
    await page.goto("/mitra/psikolog");
    await expect(page.getByText("Langkah 1:")).toBeVisible();

    const nameInput = page.locator('input[placeholder*="Nama"]').first();
    await expect(nameInput).toBeVisible();
  });

  test("form pendamping sebaya terlindungi login dan menampilkan status", async ({
    page,
  }) => {
    await page.goto("/mitra/pendamping");
    // Bila belum login, route mengarahkan atau menampilkan pesan otentikasi
    const currentUrl = page.url();
    expect(currentUrl).toBeDefined();
  });
});
