import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

const Privacy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Privacy Policy | Rent With Heldy"
      description="How Rent With Heldy collects, uses, and protects your personal information when you book a car rental in Fort Lauderdale, Miami, or South Florida."
      path="/privacy"
    />
    <Header />
    <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">Overview</h2>
          <p>
            Rent With Heldy ("we", "us") respects your privacy. This policy
            explains what information we collect when you visit
            rentwithheldy.com or book a vehicle with us, how we use it, and
            the choices you have.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Information we collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Booking information</strong> — name, email, phone, and
              trip dates submitted through our booking widget.
            </li>
            <li>
              <strong>Verification information</strong> — required by our
              booking platform (driver's license, payment method) to complete
              a reservation.
            </li>
            <li>
              <strong>Communication</strong> — messages, calls, and texts you
              send us about your reservation.
            </li>
            <li>
              <strong>Site usage</strong> — basic analytics like pages
              visited and device type, used to improve the site.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            How we use your information
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To process and manage your rental reservation.</li>
            <li>To coordinate pickup, return, and support during your trip.</li>
            <li>To respond to questions and provide customer service.</li>
            <li>To improve the website and our service quality.</li>
            <li>To comply with legal and tax obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Sharing of information
          </h2>
          <p>
            We do not sell your personal information. We share information
            only with the booking and payment platforms required to complete
            your reservation, and with service providers strictly as needed
            to operate the rental (for example, insurance verification).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Cookies and analytics
          </h2>
          <p>
            We use minimal cookies for site functionality and aggregated
            analytics. You can control cookies through your browser
            settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Your choices
          </h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal information by contacting us at{" "}
            <a
              href="mailto:rentwithheldy@gmail.com"
              className="text-primary underline"
            >
              rentwithheldy@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Contact
          </h2>
          <p>
            Rent With Heldy<br />
            Fort Lauderdale &amp; Miami, FL<br />
            Phone:{" "}
            <a href={CONTACT_PHONE_HREF} className="text-primary underline">
              {CONTACT_PHONE_DISPLAY}
            </a>
            <br />
            Email:{" "}
            <a
              href="mailto:rentwithheldy@gmail.com"
              className="text-primary underline"
            >
              rentwithheldy@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
