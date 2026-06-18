// Reusable JSON-LD schema builders

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "AutoRental",
  name: "Rent With Heldy",
  description:
    "Private car rental serving Fort Lauderdale, Miami, and South Florida. Premium fleet, easy booking, airport pickup available.",
  url: "https://rentwithheldy.com",
  telephone: "+1-786-505-9330",
  email: "rentwithheldy@gmail.com",
  priceRange: "$$",
  image:
    "https://storage.googleapis.com/gpt-engineer-file-uploads/CSzZLopKzRX2s7Gn49LVhaLvLQH2/social-images/social-1770324920970-Share_image_website.PNG",
  logo: "https://storage.googleapis.com/gpt-engineer-file-uploads/CSzZLopKzRX2s7Gn49LVhaLvLQH2/uploads/1770324874493-Vibrant_Miami_Car_Rental_Logo.png",
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
