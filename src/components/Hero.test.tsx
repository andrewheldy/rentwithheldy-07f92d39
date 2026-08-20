import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/i18n";
import Hero from "./Hero";

describe("Hero booking paths", () => {
  beforeEach(async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    window.dataLayer = [];
    await i18n.changeLanguage("en");
  });

  it("routes Plan My Trip and Browse the Fleet to their distinct paths", async () => {
    const user = userEvent.setup();
    render(
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <Hero />
          </MemoryRouter>
        </I18nextProvider>
      </HelmetProvider>,
    );

    const planner = screen.getByRole("link", { name: /Plan My Trip/i });
    const fleet = screen.getByRole("link", { name: /Browse the Fleet/i });
    expect(planner).toHaveAttribute("href", "/trip-planner");
    expect(fleet).toHaveAttribute("href", "/fleet");

    await user.click(planner);
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([expect.objectContaining({ event: "home_plan_trip_click" })]),
    );
  });
});
