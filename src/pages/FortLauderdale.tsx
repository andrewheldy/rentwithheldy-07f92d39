import LocationPageLayout from "@/components/LocationPageLayout";

const FortLauderdale = () => (
  <LocationPageLayout
    metaTitle="Car Rental Fort Lauderdale | Private Vehicle Rentals | Heldy"
    metaDescription="Private car rental in Fort Lauderdale, FL. Premium fleet, easy online booking, flexible pickup. Trusted All-Star Host serving Broward County and beyond."
    path="/car-rental-fort-lauderdale"
    crumbLabel="Fort Lauderdale"
    h1="Car Rental in Fort Lauderdale, FL"
    intro="A private, hands-on car rental experience built for Fort Lauderdale visitors, business travelers, and locals. Curated fleet, easy booking, and flexible pickup across Broward County."
    sections={[
      {
        heading: "A friendlier way to rent a car in Fort Lauderdale",
        paragraphs: [
          "Fort Lauderdale moves fast. Between the beach, downtown, the airport, the cruise port, and the constant flow of out-of-town visitors, the last thing you want is to spend your first hour in town standing in a rental counter line. Rent With Heldy offers a private, more personal alternative — a curated fleet of well-maintained cars, transparent online booking, and direct communication with the person actually handing you the keys.",
          "We're an All-Star Host on the major rental marketplaces, with hundreds of completed trips and a track record of repeat renters. That matters because in Fort Lauderdale, where every weekend brings a wave of travelers, consistency and responsiveness aren't extras — they're the whole point.",
        ],
      },
      {
        heading: "Who rents from us in Fort Lauderdale",
        paragraphs: [
          "Our renters fall into a few clear groups, and we've shaped the booking flow around what each of them actually needs.",
        ],
        bullets: [
          "Beach and weekend travelers heading to Fort Lauderdale Beach, Las Olas, or Hollywood who want a comfortable car for a few days without airport-counter hassle.",
          "Business travelers flying into FLL who need a clean sedan or SUV waiting on arrival, with simple pickup and a fixed daily rate.",
          "Cruise passengers using Port Everglades who want a short rental on either side of their sailing.",
          "Locals whose own car is in the shop, who are visiting family, or who just need an extra vehicle for a few days.",
          "Out-of-state visitors staying in Aventura, Hollywood, Pompano, or downtown Fort Lauderdale who want a vehicle delivered close to their stay.",
        ],
      },
      {
        heading: "Vehicles built for the way Fort Lauderdale actually drives",
        paragraphs: [
          "Fort Lauderdale isn't one type of trip. You might be doing I-95 runs to Miami one day, sliding down A1A the next, then loading the family up for a Sawgrass Mills shopping run. Our fleet reflects that range.",
          "We keep practical, fuel-efficient sedans for solo travelers and couples; roomy SUVs for families and groups heading to the beach or the Everglades; and a small set of premium options for visitors who want something a little more polished for a special weekend, anniversary trip, or business meeting. Every vehicle is detailed between rentals, mechanically maintained, and listed with real photos so there are no surprises at pickup.",
          "You can browse the full live fleet at any time and see exactly what's available for your dates.",
        ],
      },
      {
        heading: "Pickup, drop-off, and how we work in Fort Lauderdale",
        paragraphs: [
          "We coordinate pickup at a convenient meeting point in the Fort Lauderdale area, including locations near the airport, Port Everglades, and major hotel zones. Once your reservation is confirmed, you'll get a direct line to Heldy to lock in the exact spot and time. Most handoffs take just a few minutes — verify the license, walk the car, get the keys, and you're driving.",
          "Returns work the same way in reverse. We're flexible on timing within reason, and if your plans shift mid-trip, message us early and we'll do our best to extend or adjust without drama.",
        ],
      },
      {
        heading: "Why renters choose Rent With Heldy over big-name counters",
        paragraphs: [
          "The big-name counters at FLL serve a purpose, but they're built for volume. That means lines, upsells, surprise fees at return, and a different agent every time. We're the opposite: one host, one fleet, one phone number, and pricing you can actually predict.",
        ],
        bullets: [
          "All-Star Host status with consistently high ratings across hundreds of trips.",
          "Real-person communication — message Heldy directly before, during, and after your trip.",
          "Transparent online booking with the actual vehicle you'll be driving.",
          "Convenient pickup across Fort Lauderdale, Miami, and FLL airport.",
          "Premium and practical options without luxury-counter pricing.",
        ],
      },
      {
        heading: "Booking your Fort Lauderdale rental",
        paragraphs: [
          "Booking takes a couple of minutes. Pick your dates, choose a vehicle from the live availability, confirm online, and you'll get an instant confirmation by email. From there we'll coordinate pickup details directly. No back-and-forth quoting, no hidden inventory games — what you see in the booking widget is what's available.",
          "If you're not sure which vehicle fits your trip, call or text us and we'll point you to the right option for the number of passengers, luggage, and how far you plan to drive.",
        ],
      },
    ]}
    faqs={[
      {
        question: "Where do you pick up and drop off in Fort Lauderdale?",
        answer:
          "We coordinate pickup at a convenient location in the Fort Lauderdale area, including spots near FLL airport, Port Everglades, and major hotel zones. Exact meeting point is confirmed by message after booking.",
      },
      {
        question: "Can I rent a car in Fort Lauderdale for just one day?",
        answer:
          "Yes. We accept short rentals subject to availability. Daily rates are shown live in the booking widget when you select your dates.",
      },
      {
        question: "Do you offer SUV and family-sized rentals in Fort Lauderdale?",
        answer:
          "Yes. Our Fort Lauderdale fleet includes SUVs and roomier vehicles for families, groups, and beach trips. You can filter the live fleet by vehicle type.",
      },
      {
        question: "Are your Fort Lauderdale rentals available for cruise passengers?",
        answer:
          "Absolutely. Many of our renters use us before or after cruises out of Port Everglades. Let us know your sailing details and we'll coordinate pickup accordingly.",
      },
      {
        question: "How do I extend my Fort Lauderdale rental?",
        answer:
          "Message us before your scheduled return. As long as the car isn't already booked next, we'll extend your trip and update the reservation.",
      },
    ]}
  />
);

export default FortLauderdale;
