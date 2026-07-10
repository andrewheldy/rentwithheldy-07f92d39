import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nextProvider } from "react-i18next";
import i18n, { loadLocale } from "@/i18n";
import WheelbaseWidget from "./WheelbaseWidget";

const cases = [
  ["en", "en-us", "Live vehicle availability and booking"],
  ["es", "es-es", "Disponibilidad y reserva de vehículos en tiempo real"],
  ["fr", "fr-fr", "Disponibilités et réservation des véhicules en temps réel"],
  ["pt", "en-us", "Disponibilidade e reserva de veículos em tempo real"],
  ["he", "en-us", "זמינות והזמנת רכבים בזמן אמת"],
] as const;

describe("WheelbaseWidget", () => {
  beforeEach(async () => {
    document.body.replaceChildren();
    delete window.Outdoorsy;
    await i18n.changeLanguage("en");
  });

  it.each(cases)(
    "uses the supported Wheelbase locale for %s",
    async (language, wheelbaseLocale, accessibleName) => {
      await loadLocale(language);
      await i18n.changeLanguage(language);

      render(
        <I18nextProvider i18n={i18n}>
          <WheelbaseWidget />
        </I18nextProvider>,
      );

      expect(screen.getByRole("region", { name: accessibleName })).toHaveAttribute(
        "dir",
        "ltr",
      );
      await waitFor(() =>
        expect(document.querySelector("#outdoorsy-book-now-container")).toHaveAttribute(
          "data-locale",
          wheelbaseLocale,
        ),
      );
      expect(document.querySelector("script[src*='wheelbase.min.js']")).not.toBeNull();
    },
  );
});
