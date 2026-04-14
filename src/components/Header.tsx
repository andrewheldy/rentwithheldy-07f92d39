import { Link, useLocation } from "react-router-dom";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/rent-with-heldy-logo.png";

const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={logo} 
              alt="Rent with Heldy Logo" 
              className="h-12 w-12 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-primary">Rent with Heldy</h1>
              <p className="text-sm text-muted-foreground">Miami • Fort Lauderdale</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`font-medium transition-colors hover:text-primary ${
                location.pathname === "/" ? "text-primary" : "text-foreground"
              }`}
            >
              Home
            </Link>
            <Link 
              to="/book" 
              className={`font-medium transition-colors hover:text-primary ${
                location.pathname === "/book" ? "text-primary" : "text-foreground"
              }`}
            >
              Book Now
            </Link>
            <Link 
              to="/about" 
              className={`font-medium transition-colors hover:text-primary ${
                location.pathname === "/about" ? "text-primary" : "text-foreground"
              }`}
            >
              About
            </Link>
          </nav>

          {/* Contact Info */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>(561) 519-8958</span>
            </div>
            
            <Link to="/book">
              <Button className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
