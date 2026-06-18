import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Terms = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Terms of Service | Rent With Heldy"
      description="Terms governing reservations, rentals, and use of the Rent With Heldy website and car rental service in Fort Lauderdale, Miami, and South Florida."
      path="/terms"
    />
    <Header />
    <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Acceptance of terms
          </h2>
          <p>
            By accessing rentwithheldy.com or booking a vehicle with Rent
            With Heldy, you agree to these terms. If you do not agree, do
            not use the site or book a vehicle.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Reservations
          </h2>
          <p>
            Reservations are made through our booking platform. The terms,
            cancellation policies, insurance requirements, and protection
            plans of that platform apply to every booking in addition to
            these terms. You are responsible for reviewing them at checkout.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Driver eligibility
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Renters must be at least 21 (some vehicles require 25+).</li>
            <li>A valid driver's license is required at pickup.</li>
            <li>Only authorized drivers listed on the reservation may operate the vehicle.</li>
            <li>The vehicle may not be used for illegal activity, racing, or off-road driving.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Vehicle use and condition
          </h2>
          <p>
            You agree to return the vehicle in the same condition as
            received, normal wear excepted. Damage, excessive cleaning needs,
            unauthorized smoking, or pet hair beyond reasonable use may
            incur fees per the booking platform's policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Cancellations and changes
          </h2>
          <p>
            Cancellation and change policies are governed by the booking
            platform you reserved through. We do our best to accommodate
            reasonable changes — message us as early as possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Liability
          </h2>
          <p>
            Rent With Heldy is not liable for personal items left in the
            vehicle, third-party traffic violations, tolls, or charges
            incurred during your rental. Insurance and protection plans are
            handled through the booking platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Website use
          </h2>
          <p>
            The content on this site is provided for informational purposes.
            We may update vehicles, pricing, and availability at any time.
            Live booking availability and pricing in the booking widget
            takes precedence over any information shown elsewhere on the
            site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Governing law
          </h2>
          <p>
            These terms are governed by the laws of the State of Florida,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Contact
          </h2>
          <p>
            Questions about these terms? Reach us at{" "}
            <a
              href="mailto:rentwithheldy@gmail.com"
              className="text-primary underline"
            >
              rentwithheldy@gmail.com
            </a>{" "}
            or{" "}
            <a href="tel:+17865059330" className="text-primary underline">
              786-505-9330
            </a>
            .
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
