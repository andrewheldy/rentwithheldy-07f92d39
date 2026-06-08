import { Link, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Star, LogIn, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/rent-with-heldy-logo.png";

const primaryLinks = [
  { to: "/", label: "Home" },
  { to: "/fleet", label: "Fleet" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
  { to: "/book", label: "Book Now" },
];

const locationLinks = [
  { to: "/car-rental-fort-lauderdale", label: "Car Rental Fort Lauderdale" },
  { to: "/local-car-rentals", label: "Local Car Rentals" },
  {
    to: "/airport-trips",
    label: "Fort Lauderdale Airport (FLL) Trips",
  },
];

const Footer = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={logo}
                alt="Rent With Heldy logo"
                className="h-10 w-10 object-contain"
              />
              <div>
                <h3 className="text-lg font-bold text-primary">Rent With Heldy</h3>
                <p className="text-sm text-muted-foreground">
                  Premium Car Rentals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">All-Star Host</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted private car rentals across Fort Lauderdale, Miami, and
              South Florida.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Explore</h4>
            <ul className="space-y-2">
              {primaryLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Service Areas</h4>
            <ul className="space-y-2">
              {locationLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialized Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">
              Specialized Services
            </h4>
            <ul className="space-y-2">
              {[
                { to: "/airport-trips", label: "Airport Trips (FLL)" },
                { to: "/body-shop-delivery", label: "Body Shop Delivery" },
                { to: "/cruise-port-delivery", label: "Cruise Port Pickup & Delivery" },
                { to: "/hotel-concierge-rentals", label: "Hotel Concierge Rentals" },
                { to: "/loss-of-use-claims", label: "Loss of Use Claims" },
                { to: "/rent-to-own", label: "Rent-To-Own Program" },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a
                  href="tel:+15615198958"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  (561) 519-8958
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a
                  href="mailto:rentwithheldy@gmail.com"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  rentwithheldy@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  Fort Lauderdale &amp; Miami, FL
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* SEO paragraph */}
        <div className="border-t border-border mt-10 pt-6">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
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
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Terms
            </Link>
            {isAdmin && (
              <Link
                to="/addcars"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <Settings className="h-3 w-3" />
                Manage Fleet
              </Link>
            )}
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <LogIn className="h-3 w-3" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
