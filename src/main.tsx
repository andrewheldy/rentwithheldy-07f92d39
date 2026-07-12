import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n, { i18nReady } from "./i18n";
import App from "./App.tsx";
import "./index.css";

void i18nReady.then(() => {
  createRoot(document.getElementById("root")!).render(
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </I18nextProvider>,
  );
});
