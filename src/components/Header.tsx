import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/rent-with-heldy-logo.png";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/airport-trips", label: "Airport Trips" },
  { to: "/rent-to-own", label: "Rent-To-Own" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled
          ? "bg-card/95 backdrop-blur shadow-card-hover border-b border-border"
          : "bg-card border-b border-border"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 shrink-0">
            <img
              src={logo}
              alt="Rent With Heldy logo"
              className="h-10 w-10 object-contain"
            />
            <div className="hidden sm:block leading-tight">
              <span className="block text-base font-bold text-primary">
                Rent With Heldy
              </span>
              <span className="block text-xs text-muted-foreground">
                Miami • Fort Lauderdale
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link to="/fleet" className="hidden md:inline-flex">
              <Button variant="outline" size="sm">
                View Fleet
              </Button>
            </Link>
            <Link to="/book">
              <Button
                size="sm"
                className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
              >
                Book Now
              </Button>
            </Link>
            <button
              type="button"
              aria-label="Toggle menu"
              className="lg:hidden p-2 text-foreground"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden pb-4 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-secondary text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}


              <a
                href="tel:+17865059330"
                className="px-3 py-2 mt-2 rounded-md text-sm font-medium text-muted-foreground flex items-center gap-2 hover:bg-secondary"
              >
                <Phone className="h-4 w-4" />
                786-505-9330
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
