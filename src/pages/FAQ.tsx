import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQAccordion from "@/components/FAQAccordion";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GENERAL_FAQS } from "@/data/faqs";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Car Rental FAQs | Booking & Pickup | Rent With Heldy"
      description="Answers to common questions about renting a car with Rent With Heldy in Fort Lauderdale, Miami, and South Florida. Booking, pickup, requirements, and more."
      path="/faq"
      jsonLd={[
        localBusinessSchema,
        buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]),
        buildFaqSchema(GENERAL_FAQS),
      ]}
    />
    <Header />
    <main>
      <section className="bg-secondary py-14">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Frequently asked questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about renting with Heldy in South
            Florida.
          </p>
        </div>
      </section>
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <FAQAccordion items={GENERAL_FAQS} />
          <div className="text-center mt-10">
            <Link to="/book">
              <Button className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default FAQ;
