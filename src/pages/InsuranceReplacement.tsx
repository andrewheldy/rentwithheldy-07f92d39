import ServicePageLayout from "@/components/ServicePageLayout";
import {
  ShieldCheck,
  Clock,
  CarFront,
  FileCheck2,
} from "lucide-react";

const InsuranceReplacement = () => (
  <ServicePageLayout
    metaTitle="Insurance Replacement Car Rental | Rent With Heldy"
    metaDescription="Car in the shop? Get an insurance replacement rental delivered in South Florida. Direct claims coordination, flexible extensions, no airport lines."
    path="/insurance-replacement"
    crumbLabel="Insurance Replacement"
    eyebrow="Insurance Replacement"
    h1="Car in the Shop? Get a Replacement Rental Delivered Today."
    intro="Skip the rental counter chaos. We deliver clean, well-maintained replacement vehicles across South Florida and coordinate directly with your insurance adjuster — so you can keep moving while your car is repaired."
    serviceContext="Insurance Replacement"
    valueProps={[
      {
        icon: Clock,
        title: "No Airport Lines",
        description:
          "We deliver to your home, office, or repair shop. No counters, no shuttles, no hour-long pickup.",
      },
      {
        icon: CarFront,
        title: "Direct Drop-off to Any Shop",
        description:
          "When repairs finish, return the rental at your body shop and we'll take it from there.",
      },
      {
        icon: Clock,
        title: "Flexible Extension Options",
        description:
          "Repairs running long? Extend by text — no penalties, no re-booking gymnastics.",
      },
      {
        icon: FileCheck2,
        title: "Direct Insurance Claims Coordination",
        description:
          "We talk to your adjuster and align on rates, dates, and documentation up front.",
      },
    ]}
    partnerHeading="Are you a Claims Adjuster or Body Shop Manager?"
    partnerSubheading="Set up a direct-bill replacement for your insured. We'll handle delivery and paperwork."
    body={[
      {
        heading: "How insurance replacement rentals work with us",
        paragraphs: [
          "Your insurer (or your own policy's rental coverage) typically authorizes a daily rental rate while your vehicle is being repaired. You almost always have the right to choose your own rental provider — you do not have to use the big-name counter your adjuster suggests by default.",
          "We confirm coverage limits with your adjuster, match your class of vehicle, deliver to wherever you are, and submit clean documentation back to the claim. If repairs run over, we extend without restarting the process.",
        ],
        bullets: [
          "Confirm coverage limits and dates with your adjuster",
          "Match the authorized vehicle class from our fleet",
          "Deliver to your home, office, or body shop",
          "Extend by text if repairs run long",
          "Submit final invoice and documentation back to the claim",
        ],
      },
    ]}
    faqs={[
      {
        question: "Can I choose my own rental company for an insurance claim?",
        answer:
          "Yes. In Florida you generally have the right to choose your own rental provider as long as the daily rate and class match your policy or claim authorization. We'll confirm everything with your adjuster up front.",
      },
      {
        question: "Will you bill my insurance directly?",
        answer:
          "In most cases we can coordinate billing with your adjuster, especially for repeat partner shops. Otherwise, we can provide claim-ready invoices for reimbursement.",
      },
      {
        question: "What if my repairs take longer than expected?",
        answer:
          "Just send us a message. As long as we have availability, we extend your rental and update the paperwork — no new booking required.",
      },
      {
        question: "Do you deliver to body shops and repair centers?",
        answer:
          "Yes. We deliver to body shops and collision centers throughout Fort Lauderdale, Miami, Hollywood, Dania Beach, and surrounding areas.",
      },
      {
        question: "What vehicle classes do you offer for replacements?",
        answer:
          "Economy sedans, mid-size cars, SUVs, and premium options. We match the class your insurance has authorized.",
      },
    ]}
  />
);

export default InsuranceReplacement;
