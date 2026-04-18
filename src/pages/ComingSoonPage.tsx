import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

interface ComingSoonPageProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  path: string;
  intro: string;
}

/**
 * Lightweight placeholder for routes that will get full long-form SEO
 * content in Phase 2. Keeps the route live, indexable (via canonical),
 * and conversion-ready with a Book Now CTA.
 */
const ComingSoonPage = ({
  title,
  metaTitle,
  metaDescription,
  path,
  intro,
}: ComingSoonPageProps) => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO title={metaTitle} description={metaDescription} path={path} />
    <Header />
    <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
        {title}
      </h1>
      <p className="text-lg text-muted-foreground mb-8">{intro}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/book">
          <Button
            size="lg"
            className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
          >
            Book Now
          </Button>
        </Link>
        <Link to="/fleet">
          <Button size="lg" variant="outline">
            View Fleet
          </Button>
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mt-10">
        Detailed local guide coming soon. Need help right now? Call{" "}
        <a href="tel:+15615198958" className="text-primary underline">
          (561) 519-8958
        </a>
        .
      </p>
    </main>
    <Footer />
  </div>
);

export default ComingSoonPage;
