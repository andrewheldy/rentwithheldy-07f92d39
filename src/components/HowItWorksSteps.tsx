import { useTranslation } from "react-i18next";
import { Search, CalendarCheck, KeySquare, ShieldCheck } from "lucide-react";

const STEPS = [
  { icon: Search, key: "step1" },
  { icon: CalendarCheck, key: "step2" },
  { icon: KeySquare, key: "step3" },
  { icon: ShieldCheck, key: "step4" },
] as const;

const HowItWorksSteps = () => {
  const { t } = useTranslation("howItWorks");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {STEPS.map((s) => (
        <div
          key={s.key}
          className="bg-card border border-border rounded-card p-6 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
        >
          <div className="bg-primary/10 w-11 h-11 rounded-control flex items-center justify-center mb-4">
            <s.icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t(`steps.${s.key}.title`)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(`steps.${s.key}.body`)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default HowItWorksSteps;
