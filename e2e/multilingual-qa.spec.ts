import { expect, test } from "@playwright/test";
import { expectCleanLayout } from "./support/layout-audit";

const routes = [
  ["home", "/"],
  ["airport", "/fort-lauderdale-airport-car-rental"],
  ["hotel", "/hotel-concierge-rentals"],
  ["local", "/local-car-rentals"],
  ["contact", "/contact"],
  ["about", "/about"],
  ["faq", "/faq"],
  ["rent-to-own", "/rent-to-own"],
  ["trip-planner", "/trip-planner"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
] as const;

const locales = ["en", "es", "fr", "pt", "he"] as const;
const viewports = [
  ["375x812", { width: 375, height: 812 }],
  ["390x844", { width: 390, height: 844 }],
  ["430x932", { width: 430, height: 932 }],
  ["1440x900", { width: 1440, height: 900 }],
] as const;

for (const [viewportName, viewport] of viewports) {
  for (const locale of locales) {
    test(`${viewportName} ${locale}: all multilingual release routes`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((language) => {
        localStorage.setItem("rwh.lang", language);
      }, locale);

      const pageErrors: string[] = [];
      page.on("pageerror", (error) => {
        const isWheelbaseLocalProtocolNoise =
          error.message.includes("checkout.wheelbasepro.com") &&
          error.message.includes("Blocked a frame") &&
          error.message.includes('origin "http://127.0.0.1');
        if (!isWheelbaseLocalProtocolNoise) pageErrors.push(error.message);
      });

      for (const [routeName, path] of routes) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "he" ? "rtl" : "ltr");
        if (routeName === "trip-planner") {
          const expectedTitles = {
            en: "Trip Planner",
            es: "Planificador de viajes",
            fr: "Planificateur de trajet",
            pt: "Planejador de viagem",
            he: "מתכנן הנסיעה",
          };
          expect(await page.title()).toContain(expectedTitles[locale]);
        }

        if (routeName === "home" && viewport.width < 1024) {
          const menu = page.locator("header button[aria-label]").last();
          await menu.click();
          await expect(page.locator("[role='dialog']")).toBeVisible();
          await page.waitForTimeout(600);
          await expectCleanLayout(
            page,
            `${viewportName}/${locale}/${routeName}/mobile-menu`,
            "[role='dialog']",
          );
          await page.keyboard.press("Escape");
          await expect(page.locator("[role='dialog']")).toBeHidden();
          await page.waitForTimeout(350);
        }

        if (routeName === "faq") {
          const triggers = page.locator("main button[data-state='closed']");
          if ((await triggers.count()) > 0) {
            await triggers.first().click();
            await expect(page.locator("main [data-state='open']").last()).toBeVisible();
          }
        }

        if (routeName === "trip-planner") {
          await page.getByTestId("trip-party-step").locator("button").first().click();
          await page.getByTestId("trip-luggage-step").locator("button").nth(1).click();
          await page.getByTestId("trip-style-step").locator("button").first().click();
          await expect(page.getByTestId("trip-result")).toBeVisible();
        }

        if (locale === "he") {
          if (["privacy", "terms"].includes(routeName)) {
            await expect(page.locator("main [lang='en'][dir='ltr']")).toBeVisible();
          }
          if (["airport", "hotel"].includes(routeName)) {
            await expect(page.locator("main p[lang='en'][dir='ltr']")).toBeVisible();
          }
        }

        await expectCleanLayout(page, `${viewportName}/${locale}/${routeName}`);
      }

      expect(pageErrors, `${viewportName}/${locale}: uncaught page errors`).toEqual([]);
    });
  }
}

for (const locale of locales) {
  test(`${locale}: /book hands off to the hosted Wheelbase store in the visitor's locale`, async ({ page }) => {
    await page.route("https://widget.wheelbasepro.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<main>Wheelbase store</main>" }),
    );
    await page.addInitScript((language) => {
      localStorage.setItem("rwh.lang", language);
    }, locale);

    await page.goto("/book?wb_from=2026-08-20&wb_to=2026-08-25");
    await page.waitForURL(/widget\.wheelbasepro\.com/);

    const url = new URL(page.url());
    const expectedLocale = locale === "es" ? "es-es" : locale === "fr" ? "fr-fr" : "en-us";
    expect(url.searchParams.get("dealer_id")).toBe("4913818");
    expect(url.searchParams.get("store_type")).toBe("auto");
    expect(url.searchParams.get("locale")).toBe(expectedLocale);
    expect(url.searchParams.get("wb_from")).toBe("2026-08-20");
    expect(url.searchParams.get("wb_to")).toBe("2026-08-25");
  });
}
