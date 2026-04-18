import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Real Turo reviews from Rent With Heldy guests.
const PLACEHOLDER_REVIEWS = [
  {
    name: "Devario",
    location: "Verified Turo guest",
    rating: 5,
    text: "Amazing car! Great host. Will continue to rent from them each trip!",
  },
  {
    name: "Amari",
    location: "Verified Turo guest",
    rating: 5,
    text: "Gary was an excellent host! Clean car and very responsive, definitely will book again!",
  },
  {
    name: "Susan",
    location: "Verified Turo guest",
    rating: 5,
    text: "Awesome! Thanks, great specific directions. No issues. Appreciate the tip about the gas station for refueling.",
  },
  {
    name: "Madisol",
    location: "Verified Turo guest",
    rating: 5,
    text: "Good on gas, did the job, shuttle was great and if you just need a simple car that is reliable than this is it.",
  },
  {
    name: "Christopher",
    location: "Verified Turo guest",
    rating: 5,
    text: "Car quality was cleanest ever, customer service was the best ever. I highly recommend. Please make sure to check out this host.",
  },
  {
    name: "Queen",
    location: "Verified Turo guest",
    rating: 5,
    text: "Good host!! Great car, very clean!",
  },
  {
    name: "Todd",
    location: "Verified Turo guest",
    rating: 5,
    text: "Cool vehicle. Pleasure to drive. Thanks!",
  },
  {
    name: "George",
    location: "Verified Turo guest",
    rating: 5,
    text: "Amazing car and host!",
  },
  {
    name: "Monique",
    location: "Verified Turo guest",
    rating: 5,
    text: "Great customer service, even after dealing with some complications.",
  },
  {
    name: "Reinah",
    location: "Verified Turo guest",
    rating: 5,
    text: "Process was easy and convenient. The car was clean and well maintained. The shuttle system was easy, operators were friendly and I would book again.",
  },
  {
    name: "Ace",
    location: "Verified Turo guest",
    rating: 5,
    text: "Great car will rent again next time I'm in Miami! Easy!",
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
