import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SORTED_VEHICLE_TIERS,
  tierBestFor,
  type TierLabel,
  type VehicleTierId,
} from "@/config/vehicle-tiers";

interface VehicleTierFieldProps {
  selected: string;
  recommended: VehicleTierId | null;
  onChange: (id: VehicleTierId) => void;
}

const NAME = "vehicle-category";

const VehicleTierField = ({ selected, recommended, onChange }: VehicleTierFieldProps) => {
  const { t } = useTranslation("acquisition");
  const label = (item: TierLabel) => (typeof item === "string" ? item : t(item.i18nKey));

  return (
    <fieldset>
      <legend className="sr-only">{t("driver.steps.vehicleCategory.title")}</legend>
      <div className="grid gap-3">
        {SORTED_VEHICLE_TIERS.map((tier) => {
          const checked = selected === tier.id;
          const id = `${NAME}-${tier.id}`;
          return (
            <div key={tier.id} className="relative min-w-0">
              <input
                id={id}
                name={NAME}
                type="radio"
                value={tier.id}
                checked={checked}
                onChange={() => onChange(tier.id)}
                className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
              <label
                htmlFor={id}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-control border border-border bg-background px-4 py-4 text-start transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/50 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-checked:border-primary peer-checked:bg-primary/[0.06] peer-checked:shadow-card sm:px-5"
              >
                <span className="min-w-0 space-y-2">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-foreground">{t(tier.name)}</span>
                    {recommended === tier.id && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-text">
                        {t("driver.steps.vehicleCategory.recommended")}
                      </span>
                    )}
                  </span>
                  <span className="block text-sm leading-5 text-muted-foreground">
                    {t(tier.description)}
                  </span>
                  <span className="block space-y-1.5 text-sm leading-5">
                    <span className="block font-medium text-foreground">
                      {t("driver.steps.vehicleCategory.examples")}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {tier.exampleVehicles.map((vehicle) => (
                        <bdi key={vehicle} className="rounded-full border border-border bg-card px-2.5 py-0.5 text-foreground">
                          {vehicle}
                        </bdi>
                      ))}
                    </span>
                    <span className="block text-muted-foreground">{t(tier.similarVehicles)}</span>
                  </span>
                  <span className="block space-y-1.5 text-sm leading-5">
                    <span className="block font-medium text-foreground">
                      {t("driver.steps.vehicleCategory.bestFor")}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {tierBestFor(tier).map((item) => (
                        <bdi key={label(item)} className="rounded-full bg-muted px-2.5 py-0.5 text-foreground">
                          {label(item)}
                        </bdi>
                      ))}
                    </span>
                  </span>
                  {tier.disclaimer && (
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {t(tier.disclaimer)}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </label>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {t("driver.steps.vehicleCategory.eligibility")}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {t("driver.steps.vehicleCategory.premiumPrefix")}{" "}
        <Link to="/contact" className="font-semibold text-primary-text hover:underline">
          {t("driver.steps.vehicleCategory.premiumLink")}
        </Link>
      </p>
    </fieldset>
  );
};

export default VehicleTierField;
