import ServicePageLayout from "@/components/ServicePageLayout";
import { Scale, FileText, Clock, ShieldCheck } from "lucide-react";

const LossOfUseClaims = () => (
  <ServicePageLayout
    metaTitle="Loss of Use Rental Claims | Rent With Heldy"
    metaDescription="Loss of use rental documentation for personal injury attorneys and paralegals in South Florida. Clean invoicing, direct claims coordination, fair daily rates."
    path="/loss-of-use-claims"
    crumbLabel="Loss of Use Claims"
    eyebrow="Loss of Use Claims"
    h1="Loss of Use Rentals & Documentation for PI Attorneys."
    intro="A resource for personal injury attorneys, paralegals, and claimants navigating loss of use damages in South Florida. Fair daily rates, clean invoicing, and a real human on the phone when you need documentation."
    serviceContext="Loss of Use Claim"
    verticalPath="loss-of-use"
    defaultPassengerType="Loss of Use / Legal Claim"
    valueProps={[
      {
        icon: Scale,
        title: "Claims-Ready Invoicing",
        description:
          "Detailed daily invoices with vehicle class, dates, and rate breakdowns suitable for claim files.",
      },
      {
        icon: FileText,
        title: "Documentation Support",
        description:
          "Affidavits, letters of demand support, and rental history records for litigation packets.",
      },
      {
        icon: Clock,
        title: "Fast Turnaround",
        description:
          "Most documentation requests fulfilled within one business day for active matters.",
      },
      {
        icon: ShieldCheck,
        title: "Fair, Defensible Daily Rates",
        description:
          "Market-rate pricing that holds up under carrier scrutiny — no inflated luxury padding.",
      },
    ]}
    partnerHeading="PI Attorney or Paralegal? Set up your client."
    partnerSubheading="Submit your client's claim info and we'll deliver the rental and the paperwork."
    body={[
      {
        heading: "What is loss of use, and why does the rental matter?",
        paragraphs: [
          "Loss of use is the measurable damage your client suffers when their vehicle is unavailable because of the at-fault party — typically during repair or while a total loss is being negotiated. Florida law generally allows recovery of reasonable rental costs (or a reasonable rental rate, even if the client did not rent) during that period.",
          "The strength of a loss of use claim depends heavily on documentation: actual rental invoices, vehicle class comparability, daily rates that match the market, and a clear timeline. We're built to provide all of it without theatrics.",
        ],
      },
      {
        heading: "How we work with PI firms",
        paragraphs: [
          "We work with personal injury firms across Broward and Miami-Dade who need a reliable rental partner for clients dealing with property damage claims. Our process is simple and predictable.",
        ],
        bullets: [
          "Paralegal sends client name, claim/contact info, vehicle class, and dates",
          "We deliver a comparable replacement vehicle to the client",
          "Daily invoices generated automatically — class, rate, mileage clean and itemized",
          "Documentation packets available for demand letters and litigation files",
          "Flexible extensions while liability and property damage are negotiated",
        ],
      },
    ]}
    faqs={[
      {
        question: "Do you provide loss of use rental documentation?",
        answer:
          "Yes. We provide itemized invoices, rental agreements, vehicle class documentation, and rate comparables suitable for demand letters and litigation files.",
      },
      {
        question: "Can my client rent before liability is resolved?",
        answer:
          "Yes — many of our clients rent while their property damage claim is still being negotiated. We coordinate billing or reimbursement based on the firm's preferred workflow.",
      },
      {
        question: "What daily rates do you charge for loss of use rentals?",
        answer:
          "Market-rate daily pricing by vehicle class — defensible against carrier pushback. We avoid inflated luxury padding that gets stricken from claims.",
      },
      {
        question: "How quickly can you get a client into a rental?",
        answer:
          "Same-day in most cases across Fort Lauderdale, Hollywood, Miami, and surrounding areas. Submit the partner intake form on this page or call us directly.",
      },
      {
        question: "Do you support extended rentals during total loss negotiations?",
        answer:
          "Yes. Total loss negotiations can take weeks. We accommodate extended rentals and provide ongoing documentation throughout.",
      },
    ]}
  />
);

export default LossOfUseClaims;
