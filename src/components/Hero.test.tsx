import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/i18n";
import Hero from "./Hero";

describe("Hero booking entry", () => {
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

  it("leads with the booking date picker instead of the old hero buttons", () => {
    render(
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <Hero />
          </MemoryRouter>
        </I18nextProvider>
      </HelmetProvider>,
    );

    const hero = screen.getByTestId("home-hero");
    expect(hero).toContainElement(screen.getByTestId("home-booking-widget"));
    expect(screen.queryByRole("link", { name: /Plan My Trip/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Browse the Fleet/i })).toBeNull();
  });
});
