import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, Phone, ChevronDown, Plane, BedDouble, Wrench, Anchor, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import LanguageSelector from "@/components/LanguageSelector";
import logo from "@/assets/rent-with-heldy-logo.png";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";
import { getDirection } from "@/i18n/direction";

// Structural data (routes + icons) stays here; visible labels come from the
// `navigation` namespace so only the copy is translated.
const SERVICES = [
  { to: "/fort-lauderdale-airport-car-rental", key: "airport", icon: Plane },
  { to: "/hotel-concierge-rentals", key: "hotel", icon: BedDouble },
  { to: "/body-shop-delivery", key: "bodyShop", icon: Wrench },
  { to: "/cruise-port-delivery", key: "cruise", icon: Anchor },
  { to: "/loss-of-use-claims", key: "lossOfUse", icon: FileText },
] as const;

const NAV = [
  { to: "/fleet", key: "fleet" },
  { to: "/rent-to-own", key: "rentToOwn" },
  { to: "/how-it-works", key: "howItWorks" },
  { to: "/faq", key: "faq" },
  { to: "/contact", key: "contact" },
] as const;

const Header = () => {
  const { t, i18n } = useTranslation(["navigation", "common"]);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  // In RTL the drawer should slide in from the start (left) edge.
  const sheetSide = getDirection(i18n.language) === "rtl" ? "left" : "right";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors hover:text-primary ${
      isActive ? "text-primary" : "text-foreground/80"
    }`;

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
        scrolled
          ? "bg-card/90 backdrop-blur-md border-border shadow-card"
          : "bg-card border-transparent"
      }`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo + language selector */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img
                src={logo}
                alt="Rent With Heldy logo"
                className="h-9 w-9 object-contain"
              />
              <div className="hidden sm:block leading-tight">
                <span className="block text-[15px] font-heading font-bold text-ink">
                  Rent With Heldy
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {t("common:brand.locations")}
                </span>
              </div>
            </Link>
            <LanguageSelector className="hidden sm:inline-flex" />
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            <NavLink to="/fleet" className={linkClass}>
              {t("links.fleet")}
            </NavLink>

            {/* Services dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="group inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary">
                {t("links.services")}
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2">
                {SERVICES.map((s) => (
                  <DropdownMenuItem key={s.to} asChild>
                    <Link to={s.to} className="flex items-start gap-3 rounded-control p-2.5 cursor-pointer">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary/10">
                        <s.icon className="h-4 w-4 text-primary" />
                      </span>
                      <span className="leading-tight">
                        <span className="block text-sm font-medium text-foreground">{t(`services.${s.key}.label`)}</span>
                        <span className="block text-xs text-muted-foreground">{t(`services.${s.key}.desc`)}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV.slice(1).map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {t(`links.${item.key}`)}
              </NavLink>
            ))}
          </nav>

          {/* Right side CTAs */}
          <div className="flex items-center gap-2">
            <a
              href={CONTACT_PHONE_HREF}
              dir="ltr"
              className="hidden xl:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              {CONTACT_PHONE_DISPLAY}
            </a>
            <Link to="/book" className="hidden sm:inline-flex">
              <Button size="sm">{t("common:actions.bookNow")}</Button>
            </Link>

            {/* Mobile trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={t("aria.openMenu")}
                  className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-control text-foreground hover:bg-secondary transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side={sheetSide} className="w-[86%] max-w-sm p-0 flex flex-col">
                <div className="flex items-center gap-2.5 p-5 border-b border-border">
                  <img src={logo} alt="" className="h-8 w-8 object-contain" />
                  <span className="font-heading font-bold text-ink">Rent With Heldy</span>
                </div>

                {/* Language selector — prominent, at the top of the menu */}
                <div className="px-5 py-4 border-b border-border">
                  <LanguageSelector variant="block" />
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <SheetClose asChild>
                    <Link to="/fleet" className="block py-2.5 text-base font-medium text-foreground">
                      {t("links.fleet")}
                    </Link>
                  </SheetClose>

                  <p className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("links.services")}
                  </p>
                  {SERVICES.map((s) => (
                    <SheetClose asChild key={s.to}>
                      <Link to={s.to} className="flex items-center gap-3 py-2.5 text-[15px] text-foreground/90">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary/10">
                          <s.icon className="h-4 w-4 text-primary" />
                        </span>
                        {t(`services.${s.key}.label`)}
                      </Link>
                    </SheetClose>
                  ))}

                  <p className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("links.more")}
                  </p>
                  {NAV.slice(1).map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link to={item.to} className="block py-2.5 text-base font-medium text-foreground">
                        {t(`links.${item.key}`)}
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                <div className="p-5 border-t border-border space-y-3">
                  <SheetClose asChild>
                    <Link to="/book" className="block">
                      <Button size="lg" className="w-full">{t("common:actions.bookNow")}</Button>
                    </Link>
                  </SheetClose>
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="flex items-center justify-center gap-2 text-sm font-medium text-foreground/80"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{t("common:actions.callOrText")}</span>
                    <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
