import LocationPageLayout from "@/components/LocationPageLayout";

const FLLAirport = () => (
  <LocationPageLayout
    metaTitle="Airport Car Rentals: FLL & Miami International (MIA) | Rent With Heldy"
    metaDescription="Skip the rental counters at Fort Lauderdale-Hollywood (FLL) and Miami International (MIA). Fast, friendly airport pickup with a premium private fleet."
    path="/fort-lauderdale-airport-car-rental"
    crumbLabel="Airport Rentals"
    h1="Airport Car Rentals — FLL & Miami International (MIA)"
    intro="A faster, friendlier alternative to the airport rental counters at Fort Lauderdale-Hollywood International (FLL) and Miami International (MIA). Reserve online, message us your flight, and meet your car within minutes of landing."
    sections={[
      {
        heading: "Serving both FLL and Miami International (MIA)",
        paragraphs: [
          "Whether you're landing at Fort Lauderdale-Hollywood International (FLL) or Miami International Airport (MIA), we coordinate a smooth meet-and-greet near the terminal so you can skip the rental counter entirely. Same price, same fleet, same direct line to our team — just pick the airport that fits your flight.",
          "For MIA arrivals, we typically meet just off-airport for a quick handoff, then you're straight onto 836, 95, or the Dolphin. For FLL arrivals, pickup is right by the airport with easy access to I-95, 595, and Port Everglades.",
        ],
      },
      {
        heading: "Skip the airport counter line. Get on the road faster.",
        paragraphs: [
          "If you've ever landed at FLL or MIA on a Friday afternoon, you know the routine: grab your bag, hike out to the rental center, queue behind 40 other travelers, listen to upsell pitches you didn't ask for, and finally get a car that may or may not match what you booked. Rent With Heldy is a cleaner option.",
          "We're a private host serving travelers flying into South Florida. You book online with a real vehicle and a real price, message us your flight details, and meet your car at a convenient pickup spot near the airport. No counter, no upsell, no surprise fees at return.",
        ],
      },
      {
        heading: "How FLL airport pickup works",
        paragraphs: [
          "We've made the airport pickup flow as boring and predictable as possible — which, when you've just gotten off a flight, is exactly what you want.",
        ],
        bullets: [
          "Reserve your dates and vehicle online. You'll see live availability and the actual car you're booking.",
          "After confirmation, message us your flight number and arrival time so we can plan around delays.",
          "When you land, text us as you head to baggage claim.",
          "Meet at the agreed pickup spot near FLL — quick license check, walk the car, keys, and you're driving.",
          "Return is the same in reverse: confirm a return time, meet at the spot, hand back the keys.",
        ],
      },
      {
        heading: "Built for FLL travelers",
        paragraphs: [
          "Most of our airport renters fall into a few clear groups, and the fleet is set up to fit each.",
        ],
        bullets: [
          "Business travelers flying in for one to three nights who want a clean sedan and zero friction.",
          "Families landing for a beach week, theme-park run, or cruise — looking for a roomy SUV with luggage space.",
          "Cruise passengers using Port Everglades who need a short rental on either side of their sailing.",
          "Visitors heading down to Miami, Aventura, or Hollywood who'd rather drive themselves than rideshare.",
          "Returning renters who already know us from a previous trip and just want the same car again.",
        ],
      },
      {
        heading: "Why this beats the airport counters",
        paragraphs: [
          "FLL counters are designed to maximize throughput, not your experience. We're designed around the renter — one host, one fleet, one phone number, and consistent pricing that doesn't change between booking and pickup.",
        ],
        bullets: [
          "All-Star Host with hundreds of five-star trips.",
          "Live online booking — what you see is what you drive.",
          "No surprise fees at return. The booking total is the total.",
          "Direct line to our team throughout your trip — not a 1-800 number.",
          "Flexible on timing for early arrivals, delays, and late returns within reason.",
        ],
      },
      {
        heading: "Where Heldy renters go after FLL",
        paragraphs: [
          "Once you're in the car, the rest of South Florida is yours. Most of our airport renters head to Fort Lauderdale Beach, downtown Fort Lauderdale, Hollywood, Aventura, or straight down I-95 into Miami. Some are catching cruises out of Port Everglades. Others are heading north to Boca, Delray, or West Palm.",
          "Whatever the destination, we make sure the car is ready, fueled, and clean. If you're planning a longer trip — for example, FLL to the Keys or up to Orlando — let us know when you book so we can confirm the vehicle and mileage expectations.",
        ],
      },
      {
        heading: "Reserve your FLL airport rental",
        paragraphs: [
          "Reservations take a couple of minutes. Pick your dates, choose your car from live availability, and confirm online. You'll get an instant email confirmation, and we'll coordinate the airport pickup details from there.",
        ],
      },
    ]}
    faqs={[
      {
        question: "Do you pick up directly at FLL airport?",
        answer:
          "We coordinate pickup at a convenient spot right by Fort Lauderdale-Hollywood International Airport. After booking, share your flight details and we'll confirm the exact meeting point.",
      },
      {
        question: "What if my flight is delayed?",
        answer:
          "Just text us. We track your flight number once you share it and adjust pickup timing for delays — no extra fees for normal travel changes.",
      },
      {
        question: "Can I drop the car back at FLL for an early flight?",
        answer:
          "Yes. We'll arrange a return time that fits your departure and meet you at the same convenient spot near the airport.",
      },
      {
        question: "Do you offer SUVs at FLL for families and groups?",
        answer:
          "Yes. Our fleet includes SUVs and larger vehicles ideal for families and groups landing at FLL. Filter the live fleet by vehicle type when booking.",
      },
      {
        question: "Is FLL airport pickup more expensive?",
        answer:
          "No. We don't charge airport surcharges. The price you see in the booking widget is the price you pay.",
      },
    ]}
  />
);

export default FLLAirport;
