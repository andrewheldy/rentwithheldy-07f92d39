import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";

// Google's four-color "G" — a brand mark, so it is inline SVG rather than a
// themed lucide icon.
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12.04 12.04 0 0 0 0 10.76l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

interface RedirectState {
  from?: { pathname?: string };
}

const Auth = () => {
  const { t } = useTranslation("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Where to land after a successful sign-in: back to the page that sent us
  // here (ProtectedRoute passes it in state), otherwise the account page.
  const redirectPath =
    (location.state as RedirectState | null)?.from?.pathname ?? "/profile";

  useEffect(() => {
    track("auth_view", { mode: isSignUp ? "sign_up" : "sign_in" });
  }, [isSignUp]);

  // Already signed in — go straight to the destination.
  useEffect(() => {
    if (user) navigate(redirectPath, { replace: true });
  }, [user, navigate, redirectPath]);

  const handleGoogle = async () => {
    track("auth_google_click", { mode: isSignUp ? "sign_up" : "sign_in" });
    setIsLoading(true);
    const { error } = await signInWithGoogle(redirectPath);
    if (error) {
      // Success never reaches this line: the browser navigates away to Google.
      toast({
        title: t("auth.errorTitle"),
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    track("auth_email_submit", { mode: isSignUp ? "sign_up" : "sign_in" });

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast({
          title: t("auth.errorTitle"),
          description: error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        // Email confirmation may be required, so there is no session yet —
        // stay here instead of bouncing off a protected route.
        toast({
          title: t("auth.successSignUpTitle"),
          description: t("auth.successSignUpDesc"),
        });
      } else {
        toast({
          title: t("auth.successSignInTitle"),
          description: t("auth.successSignInDesc"),
        });
        navigate(redirectPath, { replace: true });
      }
    } catch {
      toast({
        title: t("auth.errorTitle"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={t("auth.meta.title")}
        description={t("auth.meta.description")}
        path="/auth"
        noIndex
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-tropical flex items-center justify-center mb-2">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">
                {isSignUp ? t("auth.signUpTitle") : t("auth.signInTitle")}
              </CardTitle>
              <CardDescription>
                {isSignUp ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isSupabaseConfigured ? (
                <p className="text-sm text-muted-foreground text-center">
                  {t("auth.unavailable")}
                </p>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogle}
                    disabled={isLoading}
                  >
                    <GoogleIcon />
                    {t("auth.google")}
                  </Button>

                  <div className="my-4 flex items-center gap-3" role="separator">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase text-muted-foreground">
                      {t("auth.divider")}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("auth.emailLabel")}</Label>
                      <Input
                        id="email"
                        type="email"
                        dir="ltr"
                        placeholder={t("auth.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
                      <Input
                        id="password"
                        type="password"
                        dir="ltr"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-tropical text-white hover:opacity-90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                          {isSignUp ? t("auth.signingUp") : t("auth.signingIn")}
                        </>
                      ) : isSignUp ? (
                        t("auth.signUp")
                      ) : (
                        t("auth.signIn")
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isSignUp ? t("auth.toSignIn") : t("auth.toSignUp")}
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
