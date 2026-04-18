import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Placeholder review cards — swap with real Turo screenshots/quotes provided by host.
const PLACEHOLDER_REVIEWS = [
  {
    name: "Sample review",
    location: "Fort Lauderdale, FL",
    rating: 5,
    text: "Heldy made the whole rental process effortless. Pickup was on time and the car was spotless. Will book again!",
  },
  {
    name: "Sample review",
    location: "Miami, FL",
    rating: 5,
    text: "Smooth communication, easy handoff at FLL, and a great-looking SUV for our beach week. Highly recommend.",
  },
  {
    name: "Sample review",
    location: "Aventura, FL",
    rating: 5,
    text: "Professional, responsive, and flexible with timing. The car drove perfectly. Five stars across the board.",
  },
  {
    name: "Sample review",
    location: "Fort Lauderdale, FL",
    rating: 5,
    text: "Booked last-minute for a business trip. Heldy got me on the road in under an hour. Excellent service.",
  },
  {
    name: "Sample review",
    location: "Miami Beach, FL",
    rating: 5,
    text: "Clean car, fair pricing, and zero stress. Exactly what you want from a private rental.",
  },
  {
    name: "Sample review",
    location: "Hollywood, FL",
    rating: 5,
    text: "Top-tier All-Star Host. Communication was instant and the vehicle was as advertised.",
  },
];

const ReviewCard = ({
  review,
}: {
  review: (typeof PLACEHOLDER_REVIEWS)[number];
}) => (
  <Card className="w-[300px] sm:w-[340px] shrink-0 shadow-card-hover border-none">
    <CardContent className="p-6">
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: review.rating }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-primary text-primary"
            aria-hidden
          />
        ))}
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        &ldquo;{review.text}&rdquo;
      </p>
      <div className="text-xs">
        <p className="font-semibold text-foreground">{review.name}</p>
        <p className="text-muted-foreground">{review.location}</p>
      </div>
    </CardContent>
  </Card>
);

const ReviewsMarquee = () => {
  // Duplicate list so the marquee loops seamlessly
  const loop = [...PLACEHOLDER_REVIEWS, ...PLACEHOLDER_REVIEWS];

  return (
    <div
      className="relative overflow-hidden"
      aria-label="Customer reviews carousel"
    >
      {/* Edge fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex gap-4 animate-marquee will-change-transform py-2">
        {loop.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>
    </div>
  );
};

export default ReviewsMarquee;
