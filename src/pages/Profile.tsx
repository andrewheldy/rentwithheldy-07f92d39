import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, UserRound } from "lucide-react";
import { LANGUAGES } from "@/i18n/languages";
import { track } from "@/lib/analytics";

const SUPPORT_EMAIL = "rentwithheldy@gmail.com";

const ADMIN_LINKS = [
  { to: "/addcars", key: "adminFleet" },
  { to: "/admin/agreements", key: "adminAgreements" },
  { to: "/admin/leads", key: "adminLeads" },
  { to: "/admin/photos", key: "adminPhotos" },
] as const;

const Profile = () => {
  const { t } = useTranslation("account");
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    track("profile_view");
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadProfile = async () => {
      // maybeSingle: accounts created before the profiles trigger existed have
      // no row yet — that is not an error, the form just starts empty and the
      // first save upserts it.
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, preferred_language, marketing_opt_in")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        toast({
          title: t("profile.loadErrorTitle"),
          description: t("profile.tryAgain"),
          variant: "destructive",
        });
      } else if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setPreferredLanguage(data.preferred_language ?? "en");
        setMarketingOptIn(data.marketing_opt_in);
      }
      setIsLoading(false);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user, t, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      preferred_language: preferredLanguage,
      marketing_opt_in: marketingOptIn,
    });

    if (error) {
      toast({
        title: t("profile.saveErrorTitle"),
        description: t("profile.tryAgain"),
        variant: "destructive",
      });
    } else {
      track("profile_saved", { preferred_language: preferredLanguage });
      toast({
        title: t("profile.savedTitle"),
        description: t("profile.savedDesc"),
      });
    }
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: t("profile.signedOutTitle"),
      description: t("profile.signedOutDesc"),
    });
    navigate("/");
  };

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

          <Card className="border-border shadow-lg">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("profile.loading")}
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">{t("profile.emailLabel")}</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      dir="ltr"
                      value={user?.email ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">{t("profile.nameLabel")}</Label>
                    <Input
                      id="profile-name"
                      value={fullName}
                      placeholder={t("profile.namePlaceholder")}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">{t("profile.phoneLabel")}</Label>
                    <Input
                      id="profile-phone"
                      type="tel"
                      dir="ltr"
                      value={phone}
                      placeholder={t("profile.phonePlaceholder")}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-language">
                      {t("profile.languageLabel")}
                    </Label>
                    <Select
                      value={preferredLanguage}
                      onValueChange={setPreferredLanguage}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="profile-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.nativeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="profile-marketing"
                      checked={marketingOptIn}
                      onCheckedChange={(checked) =>
                        setMarketingOptIn(checked === true)
                      }
                      disabled={isSaving}
                    />
                    <Label
                      htmlFor="profile-marketing"
                      className="text-sm font-normal leading-snug text-muted-foreground"
                    >
                      {t("profile.marketingLabel")}
                    </Label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="submit"
                      className="bg-gradient-tropical text-white hover:opacity-90"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("profile.saving")}
                        </>
                      ) : (
                        t("profile.save")
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSignOut}
                      disabled={isSaving}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("profile.signOut")}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {t("profile.adminHeading")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {ADMIN_LINKS.map((link) => (
                  <Button key={link.to} asChild variant="secondary" size="sm">
                    <Link to={link.to}>{t(`profile.${link.key}`)}</Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

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
