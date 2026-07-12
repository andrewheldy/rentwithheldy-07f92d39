import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import logo from "@/assets/rent-with-heldy-logo.png";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

/**
 * Rendered by main.tsx in place of <App /> when required build-time
 * configuration is missing, so the site never mounts as a blank page.
 * Deliberately self-contained (no router, no data fetching, no Supabase
 * import) so it can render even when the rest of the app cannot.
 */
const ConfigErrorScreen = () => {
  const { t } = useTranslation("common");

  return (
    <div
      data-testid="config-error-screen"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md rounded-card border border-border bg-card p-8 text-center shadow-card">
        <img
          src={logo}
          alt="Rent With Heldy"
          className="mx-auto mb-6 h-12 w-12 object-contain"
        />
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          {t("configError.title")}
        </h1>
        <p className="mb-6 text-muted-foreground leading-relaxed">
          {t("configError.message")}
        </p>
        <a
          href={CONTACT_PHONE_HREF}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Phone className="h-4 w-4" />
          <span>{t("configError.callUs")}</span>
          <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
        </a>
      </div>
    </div>
  );
};

export default ConfigErrorScreen;
