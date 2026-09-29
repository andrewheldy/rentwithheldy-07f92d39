import { useTranslation } from "react-i18next";
import { ProfileForm } from "@/components/account/ProfileForm";

export default function OwnerSettings() {
  const { t } = useTranslation("owner");
  return (
    <main className="mx-auto w-full max-w-xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>
      <ProfileForm />
    </main>
  );
}
