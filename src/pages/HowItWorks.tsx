import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import HowItWorksSteps from "@/components/HowItWorksSteps";
import FAQAccordion from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const FAQS = [
  {
    question: "How long does the booking take?",
    answer:
      "Most reservations are completed in under three minutes. You pick your dates, choose your vehicle from live availability, and confirm online. You'll receive an email confirmation immediately.",
  },
  {
    question: "When is my reservation actually confirmed?",
    answer:
      "Your reservation is confirmed the moment you finish checkout in the booking widget. The vehicle is held for your dates and you'll receive an instant confirmation email.",
  },
  {
    question: "What happens after I book?",
    answer:
      "Our team will reach out to coordinate pickup details — exact location, time, and any vehicle prep notes. You'll have a direct line throughout your rental.",
  },
  {
    question: "What do I need to bring to pickup?",
    answer:
      "A valid driver's license, a credit card in the renter's name, and proof of insurance or an active protection plan. International renters: bring your license and passport.",
  },
  {
    question: "Can I change or cancel my reservation?",
    answer:
      "Yes — message us as early as possible. We're flexible within reason and will work with you on date changes or cancellations subject to the booking platform's policy.",
  },
];

const HowItWorks = () => {
  const jsonLd = [
    localBusinessSchema,
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "How It Works", path: "/how-it-works" },
    ]),
    buildFaqSchema(FAQS),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="How It Works | Easy Car Rental Booking | Rent With Heldy"
        description="See how renting a car with Rent With Heldy works — search availability, choose your vehicle, confirm online, and meet us for pickup in Fort Lauderdale or Miami."
        path="/how-it-works"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-subtle border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              How booking with Heldy works
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              A simple, transparent rental process from search to return.
              Built for South Florida visitors and locals who want a real
              alternative to corporate rental counters.
            </p>
            <Link to="/book">
              <Button
                size="lg"
                className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
              >
                Start Booking
              </Button>
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <HowItWorksSteps />
        </section>

        {/* Detailed walkthrough */}
        <section className="container mx-auto px-4 py-8 md:py-12 max-w-3xl space-y-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              1. Find your dates and vehicle
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tap <strong>Book Now</strong> anywhere on the site to open the
              live booking widget. Select your pickup and return dates, and
              you'll see exactly which vehicles are available — with real
              photos, real categories, and the actual price for your trip.
              No bait-and-switch, no "or similar" surprises.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              2. Reserve in minutes
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Pick the car you want and complete checkout. Reservations are
              confirmed instantly — you'll get an email with your booking
              details right away. The vehicle is then held exclusively for
              your dates.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              3. Coordinate pickup with our team
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              After booking, our team will reach out directly to confirm pickup
              location and timing. We meet at convenient spots in Fort
              Lauderdale, Miami, or near FLL airport. If you're flying in,
              share your flight number and we'll plan around your arrival —
              including delays.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              4. Quick handoff and you're driving
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              At pickup we verify your license, walk the car together, hand
              over the keys, and you're on your way. Most handoffs take just
              a few minutes. You'll have our team's direct number for the entire
              rental — no 1-800 lines, no script-reading agents.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              5. Easy return
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Return the vehicle at the agreed time and location. We're
              flexible within reason on early or late returns — just give us
              a heads up. Need to extend? Message early; if the car isn't
              already booked next, we'll keep you in it.
            </p>
          </div>
        </section>

        {/* What you need */}
        <section className="bg-secondary/40 border-y border-border">
          <div className="container mx-auto px-4 py-10 max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              What you'll need at pickup
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>A valid driver's license (international licenses welcome with passport).</li>
              <li>A credit card in the renter's name.</li>
              <li>Proof of insurance or an active protection plan via the booking platform.</li>
              <li>Minimum age 21 (some premium vehicles require 25+).</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Frequently asked questions
          </h2>
          <FAQAccordion items={FAQS} />
        </section>

        {/* CTA */}
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              Ready to book your South Florida rental?
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              Reserve in minutes. Premium fleet. Real-person service from
              pickup to return.
            </p>
            <Link to="/book">
              <Button size="lg" variant="secondary" className="font-semibold">
                Book Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
