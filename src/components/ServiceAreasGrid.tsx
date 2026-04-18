import { Link } from "react-router-dom";
import { MapPin, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AREAS = [
  {
    to: "/car-rental-fort-lauderdale",
    icon: MapPin,
    title: "Car Rental Fort Lauderdale",
    body: "Beach trips, business travel, and local errands across Broward County. Easy pickup, dependable cars.",
  },
  {
    to: "/car-rental-miami",
    icon: MapPin,
    title: "Car Rental Miami",
    body: "Premium and practical vehicles for Miami visitors and locals. Built for city driving and weekend escapes.",
  },
  {
    to: "/fort-lauderdale-airport-car-rental",
    icon: Plane,
    title: "Fort Lauderdale Airport (FLL)",
    body: "Skip the airport counters. Meet your car near FLL with a fast, friendly handoff for travelers.",
  },
];

const ServiceAreasGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {AREAS.map((a) => (
      <Link key={a.to} to={a.to} className="group">
        <Card className="h-full border-none shadow-card-hover transition-transform group-hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <a.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {a.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{a.body}</p>
            <span className="text-sm font-semibold text-primary group-hover:underline">
              Learn more →
            </span>
          </CardContent>
        </Card>
      </Link>
    ))}
  </div>
);

export default ServiceAreasGrid;
