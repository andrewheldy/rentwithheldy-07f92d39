import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/rent-with-heldy-logo.png";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/fleet", label: "Fleet" },
  { to: "/fort-lauderdale-airport-car-rental", label: "Airport Rentals" },
  { to: "/drive-to-own", label: "Drive-to-Own" },
  { to: "/local-car-rentals", label: "Local Rentals" },
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

            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 outline-none focus-visible:text-primary">
                Specialized Services
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 p-1"
              >
                {specializedServices.map((s) => (
                  <DropdownMenuItem key={s.to} asChild>
                    <Link
                      to={s.to}
                      className="flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer rounded-md"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {s.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.description}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

              <div className="mt-2 px-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Specialized Services
                </p>
                {specializedServices.map((s) => (
                  <NavLink
                    key={s.to}
                    to={s.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block px-0 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-primary"
                          : "text-foreground hover:text-primary"
                      }`
                    }
                  >
                    {s.label}
                  </NavLink>
                ))}
              </div>

              <a
                href="tel:+15615198958"
                className="px-3 py-2 mt-2 rounded-md text-sm font-medium text-muted-foreground flex items-center gap-2 hover:bg-secondary"
              >
                <Phone className="h-4 w-4" />
                (561) 519-8958
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
