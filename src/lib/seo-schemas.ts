// Reusable JSON-LD schema builders

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "AutoRental",
  name: "Rent With Heldy",
  description:
    "Private car rental serving Fort Lauderdale, Miami, and South Florida. Premium fleet, easy booking, airport pickup available.",
  url: "https://rentwithheldy.com",
  telephone: "+1-561-519-8958",
  email: "rentwithheldy@gmail.com",
  priceRange: "$$",
  areaServed: [
    { "@type": "City", name: "Fort Lauderdale" },
    { "@type": "City", name: "Miami" },
    { "@type": "AdministrativeArea", name: "South Florida" },
  ],
  address: {
    "@type": "PostalAddress",
    addressRegion: "FL",
    addressCountry: "US",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "120",
  },
};

export const buildFaqSchema = (
  items: { question: string; answer: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({
    "@type": "Question",
    name: i.question,
    acceptedAnswer: { "@type": "Answer", text: i.answer },
  })),
});

export const buildBreadcrumbSchema = (
  trail: { name: string; path: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: t.name,
    item: `https://rentwithheldy.com${t.path}`,
  })),
});
