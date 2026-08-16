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
vi.mock("@/components/HomeBookingWidget", () => ({
  default: () => <section data-testid="home-booking-widget" />,
}));
vi.mock("@/components/Header", () => ({ default: () => <header /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/hooks/useVehicles", () => ({
  useVehicles: () => ({ data: [], isLoading: false }),
}));

describe("Homepage booking hierarchy", () => {
  it("renders booking immediately after Hero and before the trust strip", () => {
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
    const booking = screen.getByTestId("home-booking-widget");
    const trust = screen.getByTestId("home-trust-strip");

    expect(hero.nextElementSibling).toBe(booking);
    expect(booking.nextElementSibling).toBe(trust);
    expect(document.querySelector("#quote form")).toBeInTheDocument();
  });
});
