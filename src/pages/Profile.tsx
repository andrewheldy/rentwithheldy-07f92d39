import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserRound } from "lucide-react";
import { track } from "@/lib/analytics";

const SUPPORT_EMAIL = "rentwithheldy@gmail.com";

// Admins land in the admin area instead; their profile lives under
// Admin → Account settings. Wait for the role check so they never see this
// page flash first.
const Profile = () => {
  const { isAdmin, rolesLoaded } = useAuth();
  if (!rolesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <CustomerProfile />;
};

const CustomerProfile = () => {
  const { t } = useTranslation("account");

  useEffect(() => {
    track("profile_view");
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={t("profile.meta.title")}
        description={t("profile.meta.description")}
        path="/profile"
        noIndex
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-tropical flex items-center justify-center mb-3">
              <UserRound className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("profile.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">{t("profile.subtitle")}</p>
          </div>

          <ProfileForm />

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {t("profile.privacyHeading")}
              </CardTitle>
              <CardDescription className="leading-relaxed">
                {t("profile.privacyBody")}{" "}
                <Link to="/privacy" className="text-primary underline">
                  {t("profile.privacyLink")}
                </Link>
                . {t("profile.dataRequestBody")}{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-primary underline"
                  dir="ltr"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
