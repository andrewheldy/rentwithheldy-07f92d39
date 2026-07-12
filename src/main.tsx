import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n, { i18nReady } from "./i18n";
import "./index.css";
import { validateSupabaseEnv } from "./lib/env";
import ConfigErrorScreen from "./components/ConfigErrorScreen";

const rootElement = document.getElementById("root")!;

void i18nReady.then(async () => {
  const envResult = validateSupabaseEnv();

  // Validated here, before `./App` (and therefore the Supabase client) is
  // ever imported. `createClient()` throws synchronously at module-scope
  // when misconfigured, which used to abort the whole module graph before
  // React rendered anything — a blank page with no diagnostic. The dynamic
  // import below means that module graph is only evaluated once we know
  // it's safe to do so.
  if (!envResult.ok) {
    console.error(
      `[config] Missing required environment variable(s): ${envResult.missing.join(", ")}. The application cannot start until these are set.`,
    );
    createRoot(rootElement).render(
      <I18nextProvider i18n={i18n}>
        <HelmetProvider>
          <ConfigErrorScreen />
        </HelmetProvider>
      </I18nextProvider>,
    );
    return;
  }

  const { default: App } = await import("./App.tsx");
  createRoot(rootElement).render(
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </I18nextProvider>,
  );
});
