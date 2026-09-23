import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n, { loadLocale } from "@/i18n";
import { loadWheelbaseComponents } from "@/lib/wheelbase";
import HomeBookingWidget from "./HomeBookingWidget";

vi.mock("@/lib/wheelbase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/wheelbase")>();
  return {
    ...actual,
    loadWheelbaseComponents: vi.fn(),
  };
});

const mockedLoader = vi.mocked(loadWheelbaseComponents);

function renderWidget() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/"]}>
        <HomeBookingWidget />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("HomeBookingWidget", () => {
  beforeEach(async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    window.dataLayer = [];
    mockedLoader.mockReset();
    mockedLoader.mockResolvedValue();
    await i18n.changeLanguage("en");
  });

  it.each([
    ["en", "en-us"],
    ["es", "es-es"],
    ["fr", "fr-fr"],
    ["pt", "en-us"],
    ["he", "en-us"],
  ] as const)("supplies the correct Wheelbase locale for %s", async (language, expected) => {
    await loadLocale(language);
    await i18n.changeLanguage(language);
    renderWidget();

    const widget = await screen.findByTestId("wheelbase-landing-widget");
    expect(widget).toHaveAttribute("locale", expected);
    expect(widget).toHaveAttribute("target-url", expect.stringContaining("dealer_id=4913818"));
  });

  it("sends canonical dates to the hosted Wheelbase store and tracks trip length", async () => {
    const assign = vi.fn();
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue({ ...window.location, assign });
    renderWidget();
    const widget = (await screen.findByTestId("wheelbase-landing-widget")) as HTMLElement & {
      onSubmit: (payload: unknown) => void;
    };

    act(() => {
      widget.onSubmit({
        pickup: new Date(2026, 7, 20, 12),
        returnDate: "2026-08-25",
        url: "/book?pickup=2026-08-20&return=2026-08-25",
      });
    });

    expect(assign).toHaveBeenCalledWith(
      "https://widget.wheelbasepro.com/?dealer_id=4913818&store_type=auto&locale=en-us&wb_from=2026-08-20&wb_to=2026-08-25",
    );
    locationSpy.mockRestore();
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "home_booking_widget_submit",
          source: "homepage",
          locale: "en",
          trip_length_days: 5,
        }),
      ]),
    );
    const submitEvent = window.dataLayer?.find((event) => event.event === "home_booking_widget_submit");
    expect(submitEvent).not.toHaveProperty("pickup");
    expect(submitEvent).not.toHaveProperty("returnDate");
  });

  it("renders and tracks a usable /book fallback when the SDK fails", async () => {
    mockedLoader.mockRejectedValueOnce(new Error("network error"));
    renderWidget();

    expect(await screen.findByRole("link", { name: "Check Availability" })).toHaveAttribute(
      "href",
      "https://widget.wheelbasepro.com/?dealer_id=4913818&store_type=auto&locale=en-us",
    );
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: "home_booking_widget_fallback", locale: "en" }),
      ]),
    );
  });

  it("uses the stacked full layout on mobile without a width-expanding host", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("767px"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    renderWidget();

    const widget = await screen.findByTestId("wheelbase-landing-widget");
    await waitFor(() => expect(widget).toHaveAttribute("layout", "full"));
    expect(widget).toHaveStyle({ display: "block", width: "100%", maxWidth: "100%" });
  });
});
