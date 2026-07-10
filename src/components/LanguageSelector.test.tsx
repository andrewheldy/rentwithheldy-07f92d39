import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";
import LanguageSelector from "./LanguageSelector";

function renderSelector() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageSelector />
    </I18nextProvider>,
  );
}

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /change language/i }));
  return screen.findByRole("menu");
};

describe("LanguageSelector", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("shows the active locale's short label", () => {
    renderSelector();
    expect(
      screen.getByRole("button", { name: /change language/i }),
    ).toHaveTextContent("EN");
  });

  it("opens on click and lists native names (no flags)", async () => {
    const user = userEvent.setup();
    renderSelector();
    const menu = await openMenu(user);
    for (const name of ["English", "Español", "Français", "Português", "עברית"]) {
      expect(within(menu).getByText(name)).toBeInTheDocument();
    }
  });

  it("marks the active language with aria-current", async () => {
    const user = userEvent.setup();
    renderSelector();
    const menu = await openMenu(user);
    const active = within(menu).getByText("English").closest("[role='menuitem']");
    expect(active).toHaveAttribute("aria-current", "true");
  });

  it("switches language and persists the choice", async () => {
    const user = userEvent.setup();
    renderSelector();
    const menu = await openMenu(user);
    await user.click(within(menu).getByText("Español"));
    await waitFor(() => expect(i18n.language).toBe("es"));
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");
  });

  it("activates RTL when Hebrew is selected", async () => {
    const user = userEvent.setup();
    renderSelector();
    const menu = await openMenu(user);
    await user.click(within(menu).getByText("עברית"));
    await waitFor(() =>
      expect(document.documentElement.getAttribute("dir")).toBe("rtl"),
    );
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderSelector();
    await openMenu(user);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });
});
