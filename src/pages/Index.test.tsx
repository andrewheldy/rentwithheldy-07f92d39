import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/i18n";
import Index from "./Index";

vi.mock("@/components/Hero", () => ({
  default: () => <section data-testid="home-hero" />,
}));
vi.mock("@/components/Header", () => ({ default: () => <header /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/hooks/useVehicles", () => ({
  useVehicles: () => ({ data: [], isLoading: false }),
}));

describe("Homepage booking hierarchy", () => {
  it("renders the trust strip immediately after the Hero (which holds booking)", () => {
    render(
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <Index />
          </MemoryRouter>
        </I18nextProvider>
      </HelmetProvider>,
    );

    const hero = screen.getByTestId("home-hero");
    const trust = screen.getByTestId("home-trust-strip");

    expect(hero.nextElementSibling).toBe(trust);
    expect(document.querySelector("#quote form")).toBeInTheDocument();
  });
});
