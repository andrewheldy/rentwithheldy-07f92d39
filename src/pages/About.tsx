import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Shield, MapPin, Clock, Phone, Mail } from "lucide-react";
import { CONTACT_PHONE_DISPLAY } from "@/lib/contact";
import {
  buildBreadcrumbSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const About = () => {
  const { t } = useTranslation(["legal", "common"]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={t("about.meta.title")}
        description={t("about.meta.description")}
        path="/about"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t("about.hero.title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("about.hero.subtitle")}
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-lg mb-2">{t("about.values.trusted.title")}</h2>
              <p className="text-muted-foreground">
                {t("about.values.trusted.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-lg mb-2">{t("about.values.quality.title")}</h2>
              <p className="text-muted-foreground">
                {t("about.values.quality.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-lg mb-2">{t("about.values.local.title")}</h2>
              <p className="text-muted-foreground">
                {t("about.values.local.description")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <div className="bg-card rounded-lg border border-border p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">{t("about.story.heading")}</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                {t("about.story.p1")}
              </p>
              <p className="mb-4">
                {t("about.story.p2")}
              </p>
              <p>
                {t("about.story.p3")}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">{t("about.getInTouch.heading")}</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium" dir="ltr">{CONTACT_PHONE_DISPLAY}</p>
                    <p className="text-sm text-muted-foreground">{t("about.getInTouch.phoneNote")}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium" dir="ltr">rentwithheldy@gmail.com</p>
                    <p className="text-sm text-muted-foreground">{t("about.getInTouch.emailNote")}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{t("about.getInTouch.hoursLabel")}</p>
                    <p className="text-sm text-muted-foreground">{t("about.getInTouch.hoursValue")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">{t("about.serviceAreas.heading")}</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("about.serviceAreas.miamiDade.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("about.serviceAreas.miamiDade.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("about.serviceAreas.broward.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("about.serviceAreas.broward.description")}
                    </p>
                  </div>
                </div>
              </div>

              <Link to="/book" className="block mt-6">
                <Button className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical">
                  {t("about.serviceAreas.cta")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
