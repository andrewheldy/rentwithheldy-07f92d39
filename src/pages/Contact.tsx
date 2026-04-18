import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildBreadcrumbSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const Contact = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Contact Rent With Heldy | Car Rentals Fort Lauderdale & Miami"
      description="Contact Rent With Heldy for fast, private car rental support in Fort Lauderdale, Miami, and South Florida. Call, email, or book online today."
      path="/contact"
      jsonLd={[
        localBusinessSchema,
        buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]),
      ]}
    />
    <Header />
    <main>
      <section className="bg-secondary py-14">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Contact Rent With Heldy
          </h1>
          <p className="text-lg text-muted-foreground">
            The fastest way to get on the road. Call directly or book your
            vehicle online — we typically respond the same day.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-card-hover">
            <CardContent className="p-6 text-center">
              <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">Call us</h2>
              <a
                href="tel:+15615198958"
                className="text-primary font-medium hover:underline"
              >
                (561) 519-8958
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Fastest response
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-card-hover">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">Email</h2>
              <a
                href="mailto:rentwithheldy@gmail.com"
                className="text-primary font-medium hover:underline break-all"
              >
                rentwithheldy@gmail.com
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Same-day reply
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-card-hover">
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">Service area</h2>
              <p className="text-sm text-muted-foreground">
                Fort Lauderdale • Miami • South Florida
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Link to="/book">
            <Button
              size="lg"
              className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
            >
              Book Now
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Detailed contact form coming soon — calls and email are handled
            personally.
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Contact;
