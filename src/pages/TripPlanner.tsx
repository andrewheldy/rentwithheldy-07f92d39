import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import VacationQuiz from "@/components/VacationQuiz";
import {
  buildBreadcrumbSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const TripPlanner = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Trip Planner | Find the Right Rental Car | Rent With Heldy"
        description="Tell us about your trip — travelers, luggage, and vibe — and we'll recommend the right rental car from our South Florida fleet."
        path="/trip-planner"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Trip Planner", path: "/trip-planner" },
          ]),
        ]}
      />
      <Header />
      <main>
        <section className="bg-secondary py-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Plan your South Florida trip
            </h1>
            <p className="text-lg text-muted-foreground">
              Three quick questions. We'll match you to the right vehicle in our fleet.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <VacationQuiz />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TripPlanner;
