import { Link, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Star, LogIn, LogOut, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/rent-with-heldy-logo.png";

const services = [
  { to: "/fort-lauderdale-airport-car-rental", label: "Airport Delivery (FLL)" },
  { to: "/hotel-concierge-rentals", label: "Hotel Delivery" },
  { to: "/body-shop-delivery", label: "Body Shop Delivery" },
  { to: "/cruise-port-delivery", label: "Cruise Port Delivery" },
  { to: "/loss-of-use-claims", label: "Loss of Use Claims" },
  { to: "/rent-to-own", label: "Rent-To-Own Program" },
];

const locations = [
  { to: "/car-rental-fort-lauderdale", label: "Fort Lauderdale" },
  { to: "/car-rental-miami", label: "Miami" },
  { to: "/local-car-rentals", label: "Local Car Rentals" },
  { to: "/fort-lauderdale-airport-car-rental", label: "FLL Airport" },
];

const company = [
  { to: "/fleet", label: "Fleet" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const Footer = () => {
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
              Ready when you are.
            </h2>
            <p className="mt-1 text-muted-foreground">
              Book online in minutes, or reach a real person 7 days a week.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/book">
              <Button size="lg" className="w-full sm:w-auto">
                Book Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="tel:+15615198958">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Phone className="h-4 w-4" /> Call or Text
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
                <p className="text-sm text-muted-foreground">Premium private car rentals</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 text-sm mb-4">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground/80">All-Star Host on Turo</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              A family-owned fleet delivering clean, reliable cars across Fort
              Lauderdale, Miami, and South Florida — right where you need them.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-ink mb-4">Services</h3>
            <ul className="space-y-2.5">
              {services.map((l) => (
                <li key={l.to}><Link to={l.to} className={linkCls}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="font-semibold text-ink mb-4">Locations</h3>
            <ul className="space-y-2.5">
              {locations.map((l) => (
                <li key={l.to}><Link to={l.to} className={linkCls}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-ink mb-4">Company</h3>
            <ul className="space-y-2.5">
              {company.map((l) => (
                <li key={l.to}><Link to={l.to} className={linkCls}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-ink mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:+15615198958" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 text-primary shrink-0" /> (561) 519-8958
                </a>
              </li>
              <li>
                <a href="mailto:rentwithheldy@gmail.com" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 text-primary shrink-0" /> rentwithheldy@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Fort Lauderdale &amp; Miami, FL
              </li>
            </ul>
          </div>
        </div>

        {/* SEO paragraph */}
        <div className="border-t border-border mt-12 pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground max-w-4xl">
            Rent With Heldy is a private car rental service based in South
            Florida, serving travelers and locals across Fort Lauderdale, Miami,
            Hollywood, Aventura, and the Fort Lauderdale-Hollywood International
            Airport (FLL). Our curated fleet includes economy cars, SUVs,
            family-friendly vehicles, and premium options — booked online in
            minutes with flexible pickup and dependable support.
          </p>
        </div>

        <div className="border-t border-border mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Rent With Heldy. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary">Terms</Link>
            {isAdmin && (
              <Link to="/addcars" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Settings className="h-3 w-3" /> Manage Fleet
              </Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <LogOut className="h-3 w-3" /> Sign Out
              </button>
            ) : (
              <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <LogIn className="h-3 w-3" /> Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
