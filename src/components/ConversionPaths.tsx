import { ArrowRight, BriefcaseBusiness, CalendarCheck, CarFront } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { track } from "@/lib/analytics";

const PATHS = [
  { to: "/book", key: "rental", icon: CalendarCheck },
  { to: "/drive-for-work", key: "driver", icon: BriefcaseBusiness },
  { to: "/list-your-vehicle", key: "owner", icon: CarFront },
] as const;

type ConversionPathsProps = {
  variant?: "page" | "footer";
};

const ConversionPaths = ({ variant = "page" }: ConversionPathsProps) => {
  const { t } = useTranslation("common");
  const isFooter = variant === "footer";
  const headingId = `conversion-paths-${variant}`;

  return (
    <section
      aria-labelledby={headingId}
      className={isFooter ? "bg-secondary/45" : "bg-background py-12 sm:py-16"}
      data-testid={`conversion-paths-${variant}`}
    >
      <div className={isFooter ? "container mx-auto py-10 sm:py-12" : "container mx-auto"}>
        <div className="mb-7 max-w-2xl sm:mb-9">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t("conversionPaths.eyebrow")}
          </p>
          <h2 id={headingId} className="text-heading font-bold text-ink">
            {t("conversionPaths.heading")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("conversionPaths.description")}
          </p>
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-card shadow-card sm:grid sm:grid-cols-3">
          {PATHS.map(({ to, key, icon: Icon }, index) => (
            <Link
              key={to}
              to={to}
              onClick={() =>
                track("conversion_path_selected", {
                  conversion_intent: key,
                  placement: isFooter ? "footer_intent_selector" : "home_intent_selector",
                })
              }
              className={`group flex min-h-44 flex-col justify-between p-5 transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:min-h-48 sm:p-6 ${
                index > 0 ? "border-t border-border sm:border-s sm:border-t-0" : ""
              } ${index === 0 ? "bg-ink text-white hover:bg-ink/95" : "hover:bg-secondary/60"}`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-control ${
                  index === 0 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                }`}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>

              <span className="mt-7 block">
                <span className={`block font-heading text-xl font-bold ${index === 0 ? "text-white" : "text-ink"}`}>
                  {t(`conversionPaths.${key}.title`)}
                </span>
                <span className={`mt-1 block text-sm leading-relaxed ${index === 0 ? "text-white/70" : "text-muted-foreground"}`}>
                  {t(`conversionPaths.${key}.description`)}
                </span>
                <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${index === 0 ? "text-primary" : "text-foreground"}`}>
                  {t(`conversionPaths.${key}.cta`)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConversionPaths;
