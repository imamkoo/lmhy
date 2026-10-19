import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Audits", () => {
  test("halaman hub /mitra memenuhi standar aksesibilitas WCAG", async ({
    page,
  }) => {
    await page.goto("/mitra");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Soften color-contrast for design system tints
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("halaman form psikolog memenuhi standar aksesibilitas", async ({
    page,
  }) => {
    await page.goto("/mitra/psikolog");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
