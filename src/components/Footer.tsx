import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, Star, LogIn, LogOut, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/rent-with-heldy-logo.png";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

const services = [
  { to: "/fort-lauderdale-airport-car-rental", key: "airport" },
  { to: "/hotel-concierge-rentals", key: "hotel" },
  { to: "/body-shop-delivery", key: "bodyShop" },
  { to: "/cruise-port-delivery", key: "cruise" },
  { to: "/loss-of-use-claims", key: "lossOfUse" },
  { to: "/rent-to-own", key: "rentToOwn" },
] as const;

const locations = [
  { to: "/car-rental-fort-lauderdale", key: "fortLauderdale" },
  { to: "/car-rental-miami", key: "miami" },
  { to: "/local-car-rentals", key: "local" },
  { to: "/fort-lauderdale-airport-car-rental", key: "fllAirport" },
] as const;

const company = [
  { to: "/fleet", key: "fleet" },
  { to: "/how-it-works", key: "howItWorks" },
  { to: "/about", key: "about" },
  { to: "/faq", key: "faq" },
  { to: "/contact", key: "contact" },
] as const;

const Footer = () => {
  const { t } = useTranslation(["footer", "common"]);
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const linkCls = "text-sm text-muted-foreground hover:text-primary transition-colors";

  return (
    <footer className="border-t border-border bg-card">
      {/* CTA band */}
      <div className="border-b border-border">
        <div className="container mx-auto py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-heading font-bold text-ink">
              {t("cta.heading")}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t("cta.subheading")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/book">
              <Button size="lg" className="w-full sm:w-auto">
                {t("common:actions.bookNow")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={CONTACT_PHONE_HREF}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Phone className="h-4 w-4" /> {t("common:actions.callOrText")}
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 gap-y-10">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Rent With Heldy logo" className="h-10 w-10 object-contain" />
              <div className="leading-tight">
                <p className="font-heading text-lg font-bold text-ink">Rent With Heldy</p>
                <p className="text-sm text-muted-foreground">{t("brand.tagline")}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 text-sm mb-4">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground/80">{t("brand.badge")}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              {t("brand.description")}
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-ink mb-4">{t("columns.services")}</h3>
            <ul className="space-y-2.5">
              {services.map((l) => (
                <li key={l.to}><Link to={l.to} className={linkCls}>{t(`services.${l.key}`)}</Link></li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="font-semibold text-ink mb-4">{t("columns.locations")}</h3>
            <ul className="space-y-2.5">
              {locations.map((l) => (
                <li key={l.to}><Link to={l.to} className={linkCls}>{t(`locations.${l.key}`)}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-ink mb-4">{t("columns.company")}</h3>
            <ul className="space-y-2.5">
              {company.map((l) => (
                <li key={l.to}><Link to={l.to} className={linkCls}>{t(`company.${l.key}`)}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-ink mb-4">{t("columns.contact")}</h3>
            <ul className="space-y-3">
              <li>
                <a href={CONTACT_PHONE_HREF} dir="ltr" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 text-primary shrink-0" /> {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href="mailto:rentwithheldy@gmail.com" dir="ltr" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 text-primary shrink-0" /> rentwithheldy@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {t("contact.location")}
              </li>
            </ul>
          </div>
        </div>

        {/* SEO paragraph */}
        <div className="border-t border-border mt-12 pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground max-w-4xl">
            {t("seoParagraph")}
          </p>
        </div>

        <div className="border-t border-border mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {t("legal.rights", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary">{t("legal.privacy")}</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary">{t("legal.terms")}</Link>
            {isAdmin && (
              <Link to="/addcars" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Settings className="h-3 w-3" /> {t("legal.manageFleet")}
              </Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <LogOut className="h-3 w-3" /> {t("legal.signOut")}
              </button>
            ) : (
              <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <LogIn className="h-3 w-3" /> {t("legal.admin")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
