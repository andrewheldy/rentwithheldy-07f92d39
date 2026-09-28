import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { expectCleanLayout } from "./support/layout-audit";

// Debit cards, Affirm and bring-your-own insurance on /faq and /how-it-works,
// in every locale (Hebrew RTL included) at phone, tablet and desktop widths.

const locales = ["en", "es", "fr", "pt", "he"] as const;
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const load = (locale: string, ns: string) =>
  JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}/${ns}.json`, import.meta.url), "utf8"));

for (const locale of locales) {
  const faq = load(locale, "faq");
  const how = load(locale, "howItWorks");
  // The two questions added after "What documents do I need?".
  const [payment, insurance] = faq.items.slice(6, 8) as { question: string; answer: string }[];

  test(`${locale}: payment and insurance copy on FAQ and How It Works`, async ({ page }) => {
    expect(payment.answer).toContain("Affirm");
    await page.addInitScript((language) => localStorage.setItem("rwh.lang", language), locale);

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto("/faq");
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "he" ? "rtl" : "ltr");
      await expect(page.getByText(faq.items[5].answer)).toHaveCount(0); // closed accordion
      for (const item of [faq.items[5], payment, insurance]) {
        await page.getByRole("button", { name: item.question }).click();
        await expect(page.getByText(item.answer)).toBeVisible();
      }
      // Opening lower items scrolls them under the sticky header; audit from the top.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await expectCleanLayout(page, `${locale}/faq @ ${vp.name}`);

      await page.goto("/how-it-works");
      for (const item of how.pickup.items as string[]) await expect(page.getByText(item, { exact: true })).toBeVisible();
      await expect(page.getByText(how.walkthrough.step2.body)).toBeVisible();
      await expectCleanLayout(page, `${locale}/how-it-works @ ${vp.name}`);
    }
  });
}
