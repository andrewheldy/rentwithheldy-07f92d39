import LocationPageLayout from "@/components/LocationPageLayout";

const LocalCarRentals = () => (
  <LocationPageLayout
    metaTitle="Local Car Rentals South Florida | Work & Repair Rentals | Rent With Heldy"
    metaDescription="Daily, weekly, and monthly local car rentals in Miami & Fort Lauderdale. Reliable rides for work, commuting, and while your car is in the shop. Easy booking, friendly service."
    path="/local-car-rentals"
    crumbLabel="Local Car Rentals"
    h1="Local Car Rentals for Work & While Your Car's in the Shop"
    intro="A dependable rental for the people who actually need a car day in, day out — commuters, contractors, service pros, and drivers waiting on a repair. Clean vehicles, flexible terms, and a real human on the other end of every booking."
    sections={[
      {
        heading: "Built for South Floridians who need a car right now",
        paragraphs: [
          "Not every rental is for a vacation. A lot of our renters are locals who simply need wheels — a contractor whose work van is in the shop, a nurse picking up extra shifts, a rideshare driver between cars, or a family stuck without a vehicle after a fender-bender. We built our local rental program around exactly those situations.",
          "Pricing is fair, the cars are clean, and we won't lock you into rigid corporate-counter rules. Daily, weekly, and monthly rates available with one direct point of contact from start to finish.",
        ],
      },
      {
        heading: "Who books local rentals with us",
        paragraphs: [
          "If you live, work, or are stuck without a car in South Florida, this is for you.",
        ],
        bullets: [
          "Drivers whose car is in the body shop or mechanic after an accident or breakdown.",
          "Workers who need a reliable commuter while their daily driver is unavailable.",
          "Contractors, real-estate agents, and field service pros who need a clean professional car for client visits.",
          "Locals between cars — selling one, waiting on the next.",
          "Families needing a temporary second vehicle for school runs, errands, and shifts.",
          "Rideshare and delivery drivers needing a short-term car while figuring out longer-term plans.",
        ],
      },
      {
        heading: "Daily, weekly, and monthly local rates",
        paragraphs: [
          "Need a car for three days while your bumper gets fixed? Done. Need something for the next month while you sort out a totaled vehicle with insurance? Also done. Local rentals are priced to make sense for real-life timelines, not just weekend trips.",
          "Weekly and monthly bookings get the best rates. If your insurance is covering loss-of-use, we can also bill direct or provide the documentation your adjuster needs.",
        ],
      },
      {
        heading: "Pickup, delivery, and how it works",
        paragraphs: [
          "Most local renters meet us at a convenient point in Fort Lauderdale or Miami. If your car is being repaired, we can often meet you at the body shop so you walk out of one car and into another — no Uber in between.",
          "Once your reservation is confirmed, you'll get a direct line to coordinate the exact time and place. Returns are flexible, and extensions are usually easy as long as we know in advance.",
        ],
      },
      {
        heading: "Why locals choose Rent With Heldy",
        paragraphs: [
          "Big-name rental counters are built for tourists and volume. Local renters get treated like an afterthought. We're the opposite.",
        ],
        bullets: [
          "All-Star Host with hundreds of trips across South Florida.",
          "Real human on the phone — not a call center.",
          "Body shop and insurance-friendly: we'll meet you, coordinate, and document.",
          "Honest weekly and monthly rates for longer rentals.",
          "Clean, well-maintained cars — sedans and SUVs ready when you are.",
        ],
      },
      {
        heading: "How to book your local rental",
        paragraphs: [
          "Pick your dates, choose a vehicle from live availability, and confirm online. We'll follow up to lock pickup specifics. If your situation is urgent — accident this morning, car towed last night — just call us and we'll get you handled.",
        ],
      },
    ]}
    faqs={[
      {
        question: "Can you meet me at the body shop or dealership?",
        answer:
          "Yes. We regularly meet renters at collision centers, dealerships, and mechanics so you can hand off keys and pick up your rental in the same stop.",
      },
      {
        question: "Do you offer weekly or monthly local rates?",
        answer:
          "We do. Weekly and monthly bookings come with reduced daily rates. Just message us with your dates and we'll send the best price for the length you need.",
      },
      {
        question: "Will my insurance pay for the rental?",
        answer:
          "Often yes — most loss-of-use and rental-coverage policies will reimburse or direct-bill. We provide all documentation your adjuster needs.",
      },
      {
        question: "Can rideshare or delivery drivers use these cars?",
        answer:
          "Short-term rideshare use can be arranged on select vehicles — please ask before booking so we can match you with a compatible car. We're also building a dedicated rent-to-own program for rideshare drivers.",
      },
      {
        question: "What's the minimum age to rent?",
        answer:
          "Renters typically need to be 21 or older. Some vehicles require 25+. The booking widget reflects age restrictions per vehicle.",
      },
    ]}
  />
);

export default LocalCarRentals;
