import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase } from "lucide-react";
import type { Vehicle } from "@/hooks/useVehicles";

interface FleetGridProps {
  vehicles: Vehicle[];
  limit?: number;
}

const FleetGrid = ({ vehicles, limit }: FleetGridProps) => {
  const list = limit ? vehicles.slice(0, limit) : vehicles;

  if (list.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Our fleet is being updated. Please check back soon or{" "}
        <Link to="/book" className="text-primary underline">
          search availability
        </Link>
        .
      </p>
    );
  }

  const productSchemas = list.map((v) => {
    const title = `${v.year} ${v.make} ${v.model}`;
    const image = v.images[0];
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: title,
      ...(image ? { image } : {}),
      brand: { "@type": "Brand", name: v.make },
      description: v.description,
      category: "Car Rental",
      offers: {
        "@type": "Offer",
        price: v.dailyRate,
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: v.dailyRate,
          priceCurrency: "USD",
          unitCode: "DAY",
        },
        availability: "https://schema.org/InStock",
        url: "https://rentwithheldy.com/book",
        seller: {
          "@type": "AutoRental",
          name: "Rent With Heldy",
        },
      },
    };
  });

  return (
    <>
      <Helmet>
        {productSchemas.map((schema, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((v) => {
          const title = `${v.year} ${v.make} ${v.model}`;
          const image = v.images[0];
          return (
            <article key={v.id}>
              <Card className="overflow-hidden shadow-card-hover border-none h-full flex flex-col">
                <div className="relative aspect-[4/3] bg-muted">
                  {image ? (
                    <img
                      src={image}
                      alt={`${title} available for rent in South Florida`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                      Photo coming soon
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {title}
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-3">
                    {v.color}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {v.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> 5 seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> Bags
                    </span>
                  </div>
                  <Link to="/book" className="mt-auto">
                    <Button className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </article>
          );
        })}
      </div>
    </>
  );
};

export default FleetGrid;
