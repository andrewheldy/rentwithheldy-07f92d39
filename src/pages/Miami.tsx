import LocationPageLayout from "@/components/LocationPageLayout";

const Miami = () => (
  <LocationPageLayout
    metaTitle="Car Rental Miami | Premium Rentals | Rent With Heldy"
    metaDescription="Private car rental in Miami, FL. Sedans, SUVs, and premium vehicles for city driving, beach days, and business travel. Easy online booking with Rent With Heldy."
    path="/car-rental-miami"
    crumbLabel="Miami"
    h1="Car Rental in Miami, FL"
    intro="A premium private car rental built for the way people actually drive Miami. Curated fleet, transparent pricing, and a real person on the other end of every reservation."
    sections={[
      {
        heading: "Renting a car in Miami without the rental-counter headache",
        paragraphs: [
          "Miami is a driving city. Whether you're hopping between Brickell meetings, heading down to Wynwood for dinner, cruising A1A, or making the run to the Keys, having the right vehicle changes the entire trip. Rent With Heldy gives Miami visitors and locals a private, well-maintained alternative to the big-name rental counters — same convenience, more personal service, often better cars.",
          "We're an All-Star Host with hundreds of completed trips across South Florida. That reputation is built on the boring stuff that actually matters: clean cars, on-time pickups, fair pricing, and a host who answers the phone.",
        ],
      },
      {
        heading: "Who books Miami rentals with us",
        paragraphs: [
          "Miami renters are some of the most varied in the country, and our fleet and process are built to flex with that.",
        ],
        bullets: [
          "Visitors flying into MIA or driving in from FLL who want a vehicle ready without standing in a counter line.",
          "Business travelers attending events in Brickell, Downtown Miami, Coral Gables, or Aventura who need a clean, professional-looking car.",
          "Couples and groups planning Miami Beach, South Beach, Coconut Grove, or Bayside days out.",
          "Families needing a roomy SUV for a week of city, beach, and theme-park driving.",
          "Cruise passengers leaving from PortMiami who want a rental for the days around their sailing.",
          "Locals between cars who need something dependable for a few days or weeks.",
        ],
      },
      {
        heading: "A Miami fleet built for city driving and weekend escapes",
        paragraphs: [
          "Miami driving demands a specific kind of car. You want something nimble enough for tight Brickell garages, comfortable enough for the AC battle on a 90-degree day, and big enough to handle luggage, beach gear, or a Costco run when the weekend calls for it.",
          "Our fleet covers exactly that range. Fuel-efficient sedans for solo drivers and city use, roomy SUVs for families and group trips, and a small set of premium vehicles for visitors who want something a little nicer for a Miami weekend, business stay, or special occasion. Every car is photographed accurately, detailed between rentals, and mechanically maintained.",
          "Browse the live fleet to see what's actually available on your dates — no bait-and-switch, no 'or similar.'",
        ],
      },
      {
        heading: "Pickup, delivery, and how we operate in Miami",
        paragraphs: [
          "We coordinate pickup at a convenient meeting point. Once your reservation is confirmed, you get a direct line to our team to lock the exact spot and time. Most handoffs take just a few minutes — quick walk around the car, license check, keys, and you're driving.",
          "If you're flying into FLL and driving down, or arriving at MIA, let us know your flight details after booking and we'll align timing. For multi-day Miami stays, we're flexible on returns within reason, and same-day extensions are usually possible if the car isn't already booked next.",
        ],
      },
      {
        heading: "Why Miami renters pick Rent With Heldy",
        paragraphs: [
          "The corporate counters at MIA exist to move volume. That means surge pricing on busy weekends, surprise add-ons at return, and a different agent every time. We're built differently.",
        ],
        bullets: [
          "All-Star Host with hundreds of five-star trips across South Florida.",
          "One host, one fleet, one number — message us directly before, during, and after.",
          "Transparent live pricing in the booking widget — the price you see is the price you pay.",
          "Premium and practical options without luxury-counter markups.",
          "Pickup convenient to Miami visitors, business stays, and PortMiami sailings.",
        ],
      },
      {
        heading: "How to book your Miami rental",
        paragraphs: [
          "Pick your dates, choose a vehicle from live availability, and confirm online. You'll get an instant email confirmation, and we'll follow up to coordinate pickup specifics. No quoting back and forth, no hidden inventory — what you see in the widget is what's bookable.",
          "Not sure which vehicle is right for your Miami trip? Call or text us. We'll match the car to the trip — passengers, luggage, mileage, and parking situation included.",
        ],
      },
    ]}
    faqs={[
      {
        question: "Do you deliver rentals to Miami hotels or short-term rentals?",
        answer:
          "We coordinate convenient meeting points in the Miami area for most stays. After booking, message us with your address and we'll confirm the closest pickup spot.",
      },
      {
        question: "Can I rent a car in Miami if I'm flying into FLL?",
        answer:
          "Yes — many of our Miami renters fly into Fort Lauderdale (FLL). We can coordinate pickup near FLL so you can drive straight down to Miami, no transfer required.",
      },
      {
        question: "Do you offer premium or luxury car rentals in Miami?",
        answer:
          "Yes. Our fleet includes select premium vehicles ideal for Miami business trips, weekends, and special occasions. Availability is shown live in the booking widget.",
      },
      {
        question: "What's the minimum age to rent a car in Miami?",
        answer:
          "Renters typically need to be 21 or older, with some premium vehicles requiring 25+. The booking widget reflects any age restrictions on each vehicle.",
      },
      {
        question: "Can I take the rental from Miami to the Keys or Orlando?",
        answer:
          "Yes, in most cases — please mention long-distance plans when you book so we can confirm the vehicle and any mileage considerations up front.",
      },
    ]}
  />
);

export default Miami;
