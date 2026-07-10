import { Link } from "react-router-dom";
import {
  Phone, Mail, ArrowRight, MapPin, Truck, MessageCircle, Users, Clock,
  Sparkles, Star,
} from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DeliveryDestinations from "@/components/DeliveryDestinations";
import Footer from "@/components/Footer";
import FleetGrid from "@/components/FleetGrid";
import HowItWorksSteps from "@/components/HowItWorksSteps";
import ReviewsMarquee from "@/components/ReviewsMarquee";
import FAQAccordion from "@/components/FAQAccordion";
import SEO from "@/components/SEO";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { useVehicles } from "@/hooks/useVehicles";
import { GENERAL_FAQS } from "@/data/faqs";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const WHY = [
  { icon: Truck, title: "Delivered, not a counter", body: "We bring the car to your terminal, hotel, or door. No lines, no shuttle bus, no rental desk." },
  { icon: MessageCircle, title: "A real local owner", body: "Text or call one number and reach the people who run the fleet — not an overseas call center." },
  { icon: Users, title: "Family-owned & bilingual", body: "A South Florida family business that treats you like a guest. Hablamos Español." },
  { icon: Clock, title: "Flexible & transparent", body: "Straightforward rates, flexible pickup, and a clean, well-maintained private fleet." },
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

        {/* Trust strip */}
        <section className="border-y border-border bg-card">
          <div className="container mx-auto py-5">
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {[
                { icon: Star, label: "All-Star Host on Turo" },
                { icon: Users, label: "Family-owned" },
                { icon: MessageCircle, label: "Hablamos Español" },
                { icon: Truck, label: "Delivered to you" },
                { icon: Clock, label: "Open 7 days a week" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground/80">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Where should we deliver your vehicle? */}
        <DeliveryDestinations />

        {/* Why Rent With Heldy — differentiation */}
        <section className="py-16 sm:py-24 bg-secondary">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <Reveal>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                  Why Rent With Heldy
                </p>
                <h2 className="text-heading font-bold text-ink mb-5">
                  Big rental brands make you come to them. We come to you.
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Enterprise, Hertz, and the airport counters mean lines, shuttle
                  buses, and fine print. A peer-to-peer app means a different
                  stranger every time. We're the middle ground travelers actually
                  want: a real, local, family-run fleet that shows up where you are.
                </p>
                <Link to="/book">
                  <Button size="lg">
                    Book Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Reveal>

              <div className="space-y-4">
                {WHY.map((w, i) => (
                  <Reveal key={w.title} delay={i * 70}>
                    <div className="flex gap-4 rounded-card border border-border bg-card p-5 shadow-card">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary/10">
                        <w.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink mb-1">{w.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <Reveal className="max-w-2xl mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                How it works
              </p>
              <h2 className="text-heading font-bold text-ink mb-4">
                From search to keys in four simple steps.
              </h2>
              <p className="text-lg text-muted-foreground">
                No counter, no surprises — just a quick, friendly handoff wherever
                works best for you.
              </p>
            </Reveal>
            <HowItWorksSteps />
            <div className="mt-10">
              <Link to="/book">
                <Button size="lg">
                  Book Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Fleet preview */}
        <section className="py-16 sm:py-24 bg-secondary">
          <div className="container mx-auto">
            <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                  The fleet
                </p>
                <h2 className="text-heading font-bold text-ink mb-4">
                  Clean, reliable cars for every South Florida plan.
                </h2>
                <p className="text-lg text-muted-foreground">
                  A peek at our most-booked rides. See live availability and the
                  full fleet anytime.
                </p>
              </div>
              <Link to="/fleet">
                <Button variant="outline">View Full Fleet</Button>
              </Link>
            </Reveal>

            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">Loading fleet…</div>
            ) : (
              <>
                <FleetGrid vehicles={featuredVehicles} limit={6} />
                <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                  <Link to="/fleet">
                    <Button size="lg">View Full Fleet</Button>
                  </Link>
                  <Link
                    to="/trip-planner"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    Not sure what fits your trip? Try the Trip Planner
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Reviews */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <Reveal className="max-w-2xl mb-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                What renters say
              </p>
              <h2 className="text-heading font-bold text-ink mb-4">
                Real reviews from Turo guests across South Florida.
              </h2>
              <p className="text-lg text-muted-foreground">
                The reason we earned All-Star Host status — clean cars, clear
                communication, and an easy handoff, trip after trip.
              </p>
            </Reveal>
          </div>
          <ReviewsMarquee />
        </section>

        {/* FAQ — reassurance */}
        <section className="py-16 sm:py-24 bg-secondary">
          <div className="container mx-auto max-w-3xl">
            <Reveal className="text-center mb-10">
              <h2 className="text-heading font-bold text-ink mb-4">
                Questions, answered.
              </h2>
              <p className="text-lg text-muted-foreground">
                A few of the things renters ask us most. More on the full FAQ.
              </p>
            </Reveal>
            <Reveal>
              <FAQAccordion items={faqPreview} />
            </Reveal>
            <div className="text-center mt-8">
              <Link to="/faq">
                <Button variant="outline">See all FAQs</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact + Quote close */}
        <section id="quote" className="scroll-mt-24 py-16 sm:py-24 bg-secondary">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
              <Reveal>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                  Get started
                </p>
                <h2 className="text-heading font-bold text-ink mb-4">
                  Tell us your trip. We'll text you back fast.
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Share a few details and we'll follow up with options — usually
                  the same day. Prefer to talk? Reach a real person below.
                </p>

                <div className="space-y-4">
                  <a href="tel:+15615198958" className="flex items-center gap-3 group">
                    <span className="flex h-11 w-11 items-center justify-center rounded-control bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </span>
                    <span className="leading-tight">
                      <span className="block font-semibold text-ink group-hover:text-primary transition-colors">
                        (561) 519-8958
                      </span>
                      <span className="block text-sm text-muted-foreground">Call or text, 7 days a week</span>
                    </span>
                  </a>
                  <a href="mailto:rentwithheldy@gmail.com" className="flex items-center gap-3 group">
                    <span className="flex h-11 w-11 items-center justify-center rounded-control bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </span>
                    <span className="leading-tight">
                      <span className="block font-semibold text-ink group-hover:text-primary transition-colors">
                        rentwithheldy@gmail.com
                      </span>
                      <span className="block text-sm text-muted-foreground">We reply the same day</span>
                    </span>
                  </a>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-control bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </span>
                    <span className="leading-tight">
                      <span className="block font-semibold text-ink">Fort Lauderdale &amp; Miami</span>
                      <span className="block text-sm text-muted-foreground">Broward &amp; Miami-Dade delivery</span>
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/book">
                    <Button size="lg" className="w-full sm:w-auto">
                      Book Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <QuickQuoteForm
                  serviceContext="Home Page Quote"
                  verticalPath="home"
                  title="Get a Quote"
                  ctaLabel="Get My Quote"
                />
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
