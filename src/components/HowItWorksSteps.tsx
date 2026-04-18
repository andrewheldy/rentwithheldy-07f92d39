import { Search, CalendarCheck, KeySquare, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "1. Choose your dates",
    body: "Tell us when you need the car and where in South Florida you'll be picking up.",
  },
  {
    icon: CalendarCheck,
    title: "2. Pick your vehicle",
    body: "Browse our live fleet and reserve the exact car that fits your trip and budget.",
  },
  {
    icon: KeySquare,
    title: "3. Pickup &amp; drive",
    body: "Meet us at your spot — Fort Lauderdale, Miami, or FLL airport. Quick handoff, full tank ready.",
  },
  {
    icon: ShieldCheck,
    title: "4. Drive supported",
    body: "Direct line to our team the whole rental. Easy returns, clear communication, no surprises.",
  },
];

const HowItWorksSteps = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {STEPS.map((s) => (
      <div
        key={s.title}
        className="bg-card border border-border rounded-xl p-6 shadow-card-hover"
      >
        <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mb-4">
          <s.icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h3
          className="text-lg font-semibold text-foreground mb-2"
          dangerouslySetInnerHTML={{ __html: s.title }}
        />
        <p
          className="text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: s.body }}
        />
      </div>
    ))}
  </div>
);

export default HowItWorksSteps;
