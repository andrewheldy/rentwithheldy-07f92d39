import { Link } from "react-router-dom";
import { Phone, ShieldCheck, Sparkles, Clock, MapPin, Key, ArrowRight, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import FleetGrid from "@/components/FleetGrid";
import HowItWorksSteps from "@/components/HowItWorksSteps";
import ServiceAreasGrid from "@/components/ServiceAreasGrid";
import ReviewsMarquee from "@/components/ReviewsMarquee";
import FAQAccordion from "@/components/FAQAccordion";
import SEO from "@/components/SEO";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVehicles } from "@/hooks/useVehicles";
import { GENERAL_FAQS } from "@/data/faqs";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const WHY_US = [
  {
    icon: ShieldCheck,
    title: "Trusted local host",
    body: "5-star All-Star Host with hundreds of trips across South Florida. Reliable cars, real support.",
  },
  {
    icon: Sparkles,
    title: "Curated premium fleet",
    body: "Hand-picked sedans, SUVs, and luxury vehicles — clean, well-maintained, and trip-ready.",
  },
  {
    icon: Clock,
    title: "Easy, fast booking",
    body: "Pick dates, see what's available, and confirm online in minutes. No counter, no surprises.",
  },
  {
    icon: MapPin,
    title: "Flexible pickup",
    body: "Fort Lauderdale, Miami, and FLL airport. We coordinate the handoff around your schedule.",
  },
];

// Hand-picked vehicle IDs to showcase on the homepage
const FEATURED_VEHICLE_IDS = [
  "044005d2-bb28-488d-95c9-53eedcfa53d3", // 2024 Audi Q5
  "048ae247-6ce5-4d2a-bfc8-cf106afe78d5", // 2022 Audi A4
  "673e22bd-8c1a-4885-bced-b767c95a8f26", // 2019 Audi Q5
  "5e6b4878-8651-4e13-92db-3a49935c5f30", // 2017 Chevrolet Suburban
  "a07cc53e-c6ba-4a96-9c1b-3bab668cbb5c", // 2015 Mercedes-Benz E350
  "508c69ca-e2e7-4816-915b-45ea2a573bff", // 2019 Volkswagen Jetta (Red)
];

const Index = () => {
  const { data: vehicles = [], isLoading } = useVehicles();
  const featuredVehicles = FEATURED_VEHICLE_IDS
    .map((id) => vehicles.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const faqPreview = GENERAL_FAQS.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Private Car Rental Fort Lauderdale & Miami | Rent With Heldy"
        description="Book a private car rental in Fort Lauderdale, Miami, and South Florida. All-Star Host, premium fleet, FLL airport pickup. Easy online booking with Rent With Heldy."
        path="/"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([{ name: "Home", path: "/" }]),
          buildFaqSchema(faqPreview),
        ]}
      />
      <Header />
      <main>
        <Hero />

        {/* Quick Quote */}
        <section className="py-12 sm:py-16 bg-secondary">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Get a fast quote
              </h2>
              <p className="text-muted-foreground">
                Tell us what you need and we'll text you back with options in minutes.
              </p>
            </div>
            <QuickQuoteForm
              serviceContext="Home Page Quote"
              verticalPath="home"
              title="Start Your Booking"
              ctaLabel="Get My Quick Quote"
            />
          </div>
        </section>

        {/* Fleet preview */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Featured vehicles
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  A peek at our most-booked rides. See live availability and the
                  full fleet anytime.
                </p>
              </div>
              <Link to="/fleet">
                <Button variant="outline">View full fleet</Button>
              </Link>
            </div>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">
                Loading fleet…
              </div>
            ) : (
              <>
                <FleetGrid vehicles={featuredVehicles} limit={6} />
                <div className="text-center mt-10">
                  <Link to="/fleet">
                    <Button
                      size="lg"
                      className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                    >
                      See More
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Why us */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Why rent with Heldy
              </h2>
              <p className="text-muted-foreground">
                Built for travelers and locals who want a smooth, premium
                rental without the rental-counter hassle.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {WHY_US.map((w) => (
                <Card key={w.title} className="border-none shadow-card-hover">
                  <CardContent className="p-6">
                    <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <w.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{w.title}</h3>
                    <p className="text-sm text-muted-foreground">{w.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                How it works
              </h2>
              <p className="text-muted-foreground">
                Four simple steps from search to keys in hand.
              </p>
            </div>
            <HowItWorksSteps />
            <div className="text-center mt-10">
              <Link to="/how-it-works">
                <Button variant="outline">See full process</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Service areas */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Where we serve
              </h2>
              <p className="text-muted-foreground">
                Local pickup across Fort Lauderdale, Miami, and Fort
                Lauderdale-Hollywood International Airport.
              </p>
            </div>
            <ServiceAreasGrid />
          </div>
        </section>

        {/* Reviews marquee */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                What renters say
              </h2>
              <p className="text-muted-foreground">
                Real feedback from travelers and locals across South Florida.
              </p>
            </div>
          </div>
          <ReviewsMarquee />
        </section>

        {/* FAQ preview */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground">
                Quick answers to the most common rental questions.
              </p>
            </div>
            <FAQAccordion items={faqPreview} />
            <div className="text-center mt-8">
              <Link to="/faq">
                <Button variant="outline">See all FAQs</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trip planner teaser */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <Card className="border-none shadow-card-hover overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                      <Sparkles className="h-3.5 w-3.5" /> Trip Planner
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                      Traveling? We'll match the right car.
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground mb-6">
                      Tell us how many people, how much luggage, and your trip
                      vibe — we'll recommend the right size and show you what's
                      available in our fleet.
                    </p>
                    <Link to="/trip-planner">
                      <Button
                        size="lg"
                        className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                      >
                        Find My Car <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <ul className="space-y-3 bg-secondary rounded-xl p-6">
                    {[
                      "Sized for your party and luggage",
                      "Filtered to vehicles we actually have",
                      "Takes under 30 seconds",
                      "No account required",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm md:text-base text-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Rent-To-Own teaser */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <Card className="border-none shadow-card-hover overflow-hidden bg-gradient-tropical">
              <CardContent className="p-8 md:p-12 text-primary-foreground">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                      <Key className="h-3.5 w-3.5" /> Rent-To-Own Program
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
                      Drive Today. Own Tomorrow.
                    </h2>
                    <p className="text-base md:text-lg text-primary-foreground/90 mb-6">
                      For Uber, Lyft, DoorDash, Uber Eats, and Instacart drivers.
                      Every qualifying payment builds toward owning the vehicle
                      you use to earn.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to="/rent-to-own">
                        <Button
                          size="lg"
                          className="bg-card text-primary hover:bg-card/90 shadow-tropical px-6"
                        >
                          Apply for Rent-To-Own
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                      <Link to="/rent-to-own#how-it-works">
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                        >
                          Learn How It Works
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <ul className="space-y-3 bg-primary-foreground/10 backdrop-blur rounded-xl p-6">
                    {[
                      "No large down payment",
                      "Built for gig workers",
                      "Track ownership progress",
                      "Reliable maintenance support",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm md:text-base">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 bg-gradient-hero relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1494905998402-395d579af36f?w=1600&h=800&fit=crop)",
            }}
            aria-hidden
          />
          <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to book your South Florida rental?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Search live availability, lock in your dates, and meet your car
              wherever works best.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/book">
                <Button
                  size="lg"
                  className="bg-card text-primary hover:bg-card/90 text-base px-8 shadow-tropical"
                >
                  Book Now
                </Button>
              </Link>
              <a href="tel:+17865059330">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <Phone className="h-5 w-5 mr-2" /> 786-505-9330
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
