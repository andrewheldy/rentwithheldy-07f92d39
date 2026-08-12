import { expect, test, type Locator } from "@playwright/test";

async function activateWithPointerAndCaptureMotion(
  button: Locator,
  motionTargetSelector: string,
  durationTargetSelector: string,
  pointerType: "mouse" | "touch" = "mouse",
) {
  return button.evaluate(
    (element, options) => new Promise<{ observed: boolean; duration: string }>((resolve) => {
      const motionTarget = document.querySelector(options.motionTargetSelector);
      if (!motionTarget) {
        resolve({ observed: false, duration: "missing-target" });
        return;
      }

      const fallback = window.setTimeout(() => {
        observer.disconnect();
        resolve({ observed: false, duration: "timeout" });
      }, 2_000);
      const observer = new MutationObserver(() => {
        if (motionTarget.getAttribute("data-motion") !== "true") return;
        window.clearTimeout(fallback);
        observer.disconnect();
        const durationTarget = document.querySelector(options.durationTargetSelector);
        resolve({
          observed: true,
          duration: durationTarget ? getComputedStyle(durationTarget).transitionDuration : "missing-duration-target",
        });
      });

      observer.observe(motionTarget, { attributes: true, attributeFilter: ["data-motion"] });
      element.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        pointerType: options.pointerType,
      }));
      (element as HTMLElement).click();
    }),
    { motionTargetSelector, durationTargetSelector, pointerType },
  );
}

test.describe("AI systems showcase", () => {
  test("renders the complete hidden narrative with noindex metadata", async ({ page }) => {
    await page.goto("/ai-systems");

    await expect(page).toHaveTitle(/AI Systems Inside a Real Business/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI That Actually Runs the Business.");
    await expect(page.getByRole("heading", { name: "The Business Is a System." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Built, Not Theoretical." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Opportunity Map" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Business Already Has AI Opportunities." })).toBeVisible();
  });

  test("builds a deterministic opportunity map", async ({ page }) => {
    await page.goto("/ai-systems");
    await page.getByRole("button", { name: "Customer Questions" }).click();

    await expect(page.getByRole("heading", { name: "Knowledge System" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Assistant / Agent" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customer Automation" })).toBeVisible();

    await page.getByRole("button", { name: "Research", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Decision Support" })).toBeVisible();
    await expect(page.getByText("2 selected", { exact: true })).toBeVisible();

    const knowledgeSystem = page.getByRole("heading", { name: "Knowledge System" }).locator("..");
    await expect(knowledgeSystem.getByText("Mapped from", { exact: true })).toBeVisible();
    await expect(knowledgeSystem.getByText("Customer Questions", { exact: true })).toBeVisible();
    await expect(knowledgeSystem.getByText("Research", { exact: true })).toBeVisible();

    const decisionSupport = page.getByRole("heading", { name: "Decision Support" }).locator("..");
    await expect(decisionSupport.getByText("Research", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Select one or more work patterns", { exact: false })).toBeVisible();
  });

  test("traces workflow prerequisites without making motion load-bearing", async ({ page }) => {
    await page.goto("/ai-systems");

    const frame = page.locator(".ai-workflow-frame");
    const stages = frame.locator(".ai-workflow-step-wrap");
    await expect(stages).toHaveCount(6);

    const pointerMotion = await activateWithPointerAndCaptureMotion(
      stages.nth(4).getByRole("button"),
      ".ai-workflow-frame",
      ".ai-workflow-step",
    );
    expect(pointerMotion).toEqual({ observed: true, duration: "0.18s" });
    for (let index = 0; index < 4; index += 1) {
      await expect(stages.nth(index)).toHaveAttribute("data-state", "prerequisite");
      await expect(stages.nth(index)).toHaveAttribute("data-connected", "true");
    }
    await expect(stages.nth(4)).toHaveAttribute("data-state", "active");
    await expect(stages.nth(5)).toHaveAttribute("data-state", "downstream");
    await expect(stages.nth(4).getByRole("button")).toHaveAttribute("aria-current", "step");
    await expect(frame.getByRole("heading", { name: "Reservation" })).toBeVisible();
    await page.waitForTimeout(240);
    await stages.nth(2).getByRole("button").focus();
    await page.keyboard.press("Enter");
    await expect(frame).toHaveAttribute("data-motion", "false");
    await expect(stages.nth(2)).toHaveAttribute("data-state", "active");
    await expect(stages.nth(0).getByRole("button")).toHaveCSS("transition-duration", "0s");
  });

  test("accepts touch-style activation through the same deterministic path", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ai-systems");

    const customerQuestions = page.getByRole("button", { name: "Customer Questions" });
    const touchMotion = await activateWithPointerAndCaptureMotion(
      customerQuestions,
      ".ai-opportunity-output",
      ".ai-recommendations article",
      "touch",
    );
    expect(touchMotion).toEqual({ observed: true, duration: "0.18s, 0.18s" });

    const output = page.locator(".ai-opportunity-output");
    await expect(page.getByRole("heading", { name: "Knowledge System" })).toBeVisible();
    await expect(output.getByText("Customer Questions", { exact: true }).first()).toBeVisible();
  });

  test("keeps Pass 2 mobile controls at least 44px tall", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ai-systems");

    for (const selector of [".ai-workflow-step", ".ai-problem-options button"]) {
      const heights = await page.locator(selector).evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height),
      );
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    }
  });

  for (const viewport of [
    { width: 320, height: 720 },
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`has no page overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/ai-systems");
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    });
  }

  test("preserves the final state with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ai-systems");

    const reveal = page.locator(".ai-reveal").first();
    await expect(reveal).toBeVisible();
    await expect(reveal).toHaveCSS("transform", "none");
    await expect(reveal).toHaveCSS("opacity", "1");

    const customerQuestions = page.getByRole("button", { name: "Customer Questions" });
    await customerQuestions.click();
    const recommendation = page.getByRole("heading", { name: "Knowledge System" }).locator("../..");
    await expect(recommendation).toHaveCSS("transition-duration", "0s");
    await expect(recommendation).toHaveCSS("transform", "none");
    await expect(recommendation.getByText("Customer Questions", { exact: true })).toBeVisible();
  });

  test("runs the specified reveal without overflow, layout shift, or focus loss", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto("/ai-systems");
    await page.evaluate(() => {
      (window as Window & { __aiLayoutShift?: number }).__aiLayoutShift = 0;
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) {
            const tracked = window as Window & { __aiLayoutShift?: number };
            tracked.__aiLayoutShift = (tracked.__aiLayoutShift ?? 0) + shift.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: false });
    });

    const reveal = page.locator(".ai-opportunity-tool");
    await expect(reveal).toHaveCSS("opacity", "0.01");
    await expect(reveal).toHaveCSS("transition-duration", "0.28s, 0.28s");
    await reveal.scrollIntoViewIfNeeded();

    for (let sample = 0; sample < 8; sample += 1) {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await page.waitForTimeout(40);
    }

    await expect(reveal).toHaveCSS("opacity", "1");
    await expect(reveal).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => (window as Window & { __aiLayoutShift?: number }).__aiLayoutShift ?? 0)).toBe(0);

    const primaryAction = page.getByRole("link", { name: "Explore the Systems" });
    await primaryAction.focus();
    await expect(primaryAction).toBeFocused();
    expect(await primaryAction.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    expect(consoleErrors).toEqual([]);
  });

  test("cleans up reveal observers across repeated SPA navigation", async ({ page }) => {
    await page.addInitScript(() => {
      const NativeObserver = window.IntersectionObserver;
      const stats = { active: 0, created: 0, disconnected: 0 };
      (window as Window & { __aiObserverStats?: typeof stats }).__aiObserverStats = stats;

      window.IntersectionObserver = class TrackedIntersectionObserver extends NativeObserver {
        private trackedDisconnected = false;

        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          super(callback, options);
          stats.active += 1;
          stats.created += 1;
        }

        disconnect() {
          if (!this.trackedDisconnected) {
            stats.active -= 1;
            stats.disconnected += 1;
            this.trackedDisconnected = true;
          }
          super.disconnect();
        }
      };
    });

    await page.goto("/ai-systems");
    await page.getByRole("button", { name: "Customer Questions" }).click();
    for (let cycle = 0; cycle < 5; cycle += 1) {
      await page.evaluate(() => {
        history.pushState({}, "", "/__ai-motion-cleanup__");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      await expect(page).toHaveURL(/__ai-motion-cleanup__/);
      await page.evaluate(() => {
        history.pushState({}, "", "/ai-systems");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI That Actually Runs the Business.");
    }

    await page.evaluate(() => {
      history.pushState({}, "", "/__ai-motion-cleanup__");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page).toHaveURL(/__ai-motion-cleanup__/);
    const stats = await page.evaluate(
      () => (window as Window & { __aiObserverStats?: { active: number; created: number; disconnected: number } }).__aiObserverStats,
    );
    expect(stats?.active).toBe(0);
    expect(stats?.created).toBe(stats?.disconnected);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("supports Hebrew RTL without changing the route", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("rwh.lang", "he"));
    await page.goto("/ai-systems");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("בינה מלאכותית");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const locale of [
    { language: "es", reason: "Mapeado desde" },
    { language: "fr", reason: "Issu de" },
    { language: "pt", reason: "Mapeado a partir de" },
    { language: "he", reason: "מופה מתוך" },
  ]) {
    test(`keeps Pass 2 relationships complete in ${locale.language}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.addInitScript((language) => localStorage.setItem("rwh.lang", language), locale.language);
      await page.goto("/ai-systems");

      await expect(page.locator(".ai-workflow-step")).toHaveCount(6);
      await page.locator(".ai-problem-options button").first().click();
      await expect(page.locator(".ai-recommendation-reasons > p").first()).toHaveText(locale.reason);
      await expect(page.locator(".ai-recommendation-reasons li").first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
