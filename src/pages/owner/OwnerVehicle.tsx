import { useTranslation } from "react-i18next";
import { Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useOwnerDashboard } from "@/components/owner/OwnerContext";
import { vehicleName } from "@/lib/consigners/format";
import { formatDay, formatPercent } from "@/lib/owner/format";

export default function OwnerVehicle() {
  const { t, i18n } = useTranslation("owner");
  const lang = i18n.language;
  const { data } = useOwnerDashboard();
  if (!data) return null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("vehicle.title")}</h1>
        <p className="text-muted-foreground">{t("vehicle.subtitle")}</p>
      </div>
      {data.vehicles.map((vehicle) => {
        const terms = data.consignments.filter((c) => c.vehicle_id === vehicle.id);
        const rows: Array<[string, string | null, boolean?]> = [
          [t("vehicle.year"), String(vehicle.year)],
          [t("vehicle.make"), vehicle.make, true],
          [t("vehicle.model"), vehicle.model, true],
          [t("vehicle.color"), vehicle.color],
          [t("vehicle.plate"), vehicle.license_plate, true],
          [t("vehicle.vin"), vehicle.vin, true],
          [t("vehicle.inService"), vehicle.in_service_on ? formatDay(vehicle.in_service_on, lang) : null],
        ];
        return (
          <Card key={vehicle.id} className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              {vehicle.photoUrl ? (
                <img src={vehicle.photoUrl} alt={vehicleName(vehicle)} className="h-56 w-full object-cover md:h-full" />
              ) : (
                <div className="flex h-56 w-full items-center justify-center bg-muted text-muted-foreground md:h-full" aria-hidden="true">
                  <Car className="h-14 w-14" />
                </div>
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold">
                  <bdi>{vehicleName(vehicle)}</bdi>
                </h2>
                <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {rows
                    .filter(([, value]) => value)
                    .map(([label, value, ltr]) => (
                      <div key={label}>
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="font-medium break-all">{ltr ? <bdi>{value}</bdi> : value}</dd>
                      </div>
                    ))}
                </dl>
                {terms.map((term) => (
                  <dl key={term.effective_from} className="mt-4 grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">{t("vehicle.share")}</dt>
                      <dd className="text-lg font-semibold">{formatPercent(term.owner_percent, lang)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">{t("vehicle.shareStarted")}</dt>
                      <dd className="font-medium">{formatDay(term.effective_from, lang)}</dd>
                    </div>
                    {term.effective_to && (
                      <div>
                        <dt className="text-sm text-muted-foreground">{t("vehicle.shareEnded")}</dt>
                        <dd className="font-medium">{formatDay(term.effective_to, lang)}</dd>
                      </div>
                    )}
                  </dl>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </main>
  );
}
