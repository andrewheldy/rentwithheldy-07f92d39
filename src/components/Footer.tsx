import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, Star, LogIn, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ConversionPaths from "@/components/ConversionPaths";
import logo from "@/assets/rent-with-heldy-logo.png";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";
import { track } from "@/lib/analytics";

const services = [
  { to: "/passenger-vans", key: "passengerVans" },
  { to: "/fort-lauderdale-airport-car-rental", key: "airport" },
  { to: "/hotel-concierge-rentals", key: "hotel" },
  { to: "/body-shop-delivery", key: "bodyShop" },
  { to: "/cruise-port-delivery", key: "cruise" },
  { to: "/loss-of-use-claims", key: "lossOfUse" },
] as const;

const workWithUs = [
  { to: "/drive-for-work", key: "driveForWork" },
  { to: "/list-your-vehicle", key: "listVehicle" },
] as const;

const locations = [
  { to: "/car-rental-fort-lauderdale", key: "fortLauderdale" },
  { to: "/car-rental-miami", key: "miami" },
  { to: "/local-car-rentals", key: "local" },
  { to: "/fort-lauderdale-airport-car-rental", key: "fllAirport" },
] as const;

const company = [
  { to: "/how-it-works", key: "howItWorks" },
  { to: "/about", key: "about" },
  { to: "/blog", key: "blog" },
  { to: "/faq", key: "faq" },
  { to: "/contact", key: "contact" },
] as const;

const Footer = () => {
  const { t } = useTranslation(["footer", "common"]);
  const navigate = useNavigate();
  // The visitor decision strip is marketing; admin screens (e.g. the blog
  // preview) render the footer without it.
  const isAdminRoute = useLocation().pathname.startsWith("/admin");
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const linkCls = "text-sm text-muted-foreground hover:text-primary transition-colors";

  return (
    <footer className="border-t border-border bg-card">
      {/* Closing decision point mirrors the same three intents used in the header and homepage. */}
      {!isAdminRoute && (
        <div className="border-b border-border">
          <ConversionPaths variant="footer" />
        </div>
      )}

      <div className="container mx-auto py-14">
        <div className="grid grid-cols-2 gap-8 gap-y-10 md:grid-cols-3 xl:grid-cols-[2fr_repeat(5,minmax(0,1fr))]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 xl:col-span-1">
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

          {/* Acquisition funnels */}
          <div>
            <h3 className="font-semibold text-ink mb-4">{t("columns.workWithUs")}</h3>
            <ul className="space-y-2.5">
              {workWithUs.map((l) => (
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
                <a href={CONTACT_PHONE_HREF} dir="ltr" onClick={() => track("call_cta_click", { placement: "footer" })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
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
