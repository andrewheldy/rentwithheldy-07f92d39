import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, BarChart3, CalendarCheck, CalendarDays, Car, CircleDollarSign, Clock, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_VEHICLES, useOwnerDashboard } from "@/components/owner/OwnerContext";
import { ChannelLegend, MonthlyRevenueChart, PlatformDonut } from "@/components/owner/OwnerCharts";
import { CHANNEL_COLOR } from "@/lib/owner/channels";
import { vehicleName } from "@/lib/consigners/format";
import { formatDayRange, formatMoney, formatNumber, formatPercent, shareOf } from "@/lib/owner/format";
import { RANGE_PRESETS, type Channel, type RangePreset } from "@/lib/owner/metrics";
import { cn } from "@/lib/utils";

function Change({ value, unit }: { value: number | null; unit: "percent" | "points" }) {
  const { t, i18n } = useTranslation("owner");
  if (value === null) return <p className="mt-2 text-sm text-muted-foreground">{t("kpi.noComparison")}</p>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const magnitude =
    unit === "percent" ? formatPercent(Math.abs(value), i18n.language) : t("kpi.points", { value: formatNumber(Math.abs(value), i18n.language, 1) });
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-emerald-700" : "text-rose-700")}>
        <Icon className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        <span dir="ltr">
          {up ? "+" : "−"}
          {magnitude}
        </span>
      </span>
      <span className="text-muted-foreground">{t("kpi.vsPrevious")}</span>
    </p>
  );
}

function KpiCard({ icon: Icon, iconClass, label, value, footer }: { icon: LucideIcon; iconClass: string; label: string; value: string; footer: ReactNode }) {
  return (
    <Card className="flex gap-4 p-4 sm:p-5">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", iconClass)} aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
          <bdi>{value}</bdi>
        </p>
        {footer}
      </div>
    </Card>
  );
}

function SectionCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

const channelTint: Record<Channel, string> = {
  wheelbase: "bg-[hsl(var(--chart-wheelbase)/0.12)] text-[hsl(var(--chart-wheelbase))]",
  turo: "bg-[hsl(var(--chart-turo)/0.12)] text-[hsl(var(--chart-turo))]",
};

export default function OwnerAnalytics() {
  const { t, i18n } = useTranslation("owner");
  const lang = i18n.language;
  const { data, metrics, range, preset, setPreset, vehicleId, setVehicleId, selectedVehicles } = useOwnerDashboard();
  if (!data || !metrics) return null;
  const { current } = metrics;

  const selectedIds = new Set(selectedVehicles.map((v) => v.id));
  const sources = new Set(data.bookings.filter((b) => selectedIds.has(b.vehicle_id)).map((b) => b.source));
  const activeOn = sources.has("turo") && sources.has("wheelbase") ? "both" : sources.has("turo") ? "turo" : sources.has("wheelbase") ? "wheelbase" : "none";
  const single = selectedVehicles.length === 1 ? selectedVehicles[0] : null;
  const percents = [...new Set(data.consignments.filter((c) => selectedIds.has(c.vehicle_id)).map((c) => c.owner_percent))];

  const earningsShare = (channel: Channel) => shareOf(current.byChannel[channel], current.earningsCents);
  const dash = "—";

  const metricRows: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: CalendarDays, label: t("metrics.utilization"), value: current.utilizationPct === null ? dash : formatPercent(current.utilizationPct, lang) },
    { icon: Clock, label: t("metrics.available"), value: formatNumber(current.availableDays, lang) },
    { icon: CalendarCheck, label: t("metrics.booked"), value: formatNumber(current.bookedDays, lang) },
    { icon: CircleDollarSign, label: t("metrics.adr"), value: current.averageDailyRateCents === null ? dash : formatMoney(current.averageDailyRateCents, lang) },
    {
      icon: ArrowLeftRight,
      label: t("metrics.tripLength"),
      value: current.averageTripDays === null ? dash : t("metrics.tripDays", { value: formatNumber(current.averageTripDays, lang, 1) }),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {single?.photoUrl ? (
            <img src={single.photoUrl} alt="" className="h-20 w-32 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
              <Car className="h-8 w-8" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold sm:text-2xl">
              {single ? <bdi>{vehicleName(single)}</bdi> : t("vehiclePicker.all")}
            </h1>
            <p className="text-muted-foreground">{t(`activeOn.${activeOn}`)}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          {data.vehicles.length > 1 && (
            <div className="min-w-0 flex-1 space-y-1 sm:w-56 sm:flex-none">
              <Label htmlFor="owner-vehicle" className="text-xs text-muted-foreground">
                {t("vehiclePicker.label")}
              </Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger id="owner-vehicle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VEHICLES}>{t("vehiclePicker.all")}</SelectItem>
                  {data.vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <bdi>{vehicleName(vehicle)}</bdi>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1 sm:w-64 sm:flex-none">
            <Label htmlFor="owner-range" className="text-xs text-muted-foreground">
              {t("range.label")}
            </Label>
            <Select value={preset} onValueChange={(value) => setPreset(value as RangePreset)}>
              <SelectTrigger id="owner-range" aria-describedby="owner-range-dates">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_PRESETS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`range.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="owner-range-dates" className="text-xs text-muted-foreground">
              {formatDayRange(range.from, range.to, lang)}
            </p>
          </div>
        </div>
      </div>

      {percents.length === 1 && (
        <p className="text-sm text-muted-foreground">{t("shareNote", { percent: formatPercent(percents[0], lang) })}</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("nav.analytics")}>
        <KpiCard
          icon={BarChart3}
          iconClass="bg-primary/10 text-primary-text"
          label={t("kpi.total")}
          value={formatMoney(current.earningsCents, lang)}
          footer={<Change value={metrics.earningsChangePct} unit="percent" />}
        />
        {(["wheelbase", "turo"] as Channel[]).map((channel) => {
          const share = earningsShare(channel);
          return (
            <KpiCard
              key={channel}
              icon={Car}
              iconClass={channelTint[channel]}
              label={t(`kpi.${channel}`)}
              value={formatMoney(current.byChannel[channel], lang)}
              footer={<p className="mt-2 text-sm text-muted-foreground">{share === null ? dash : t("kpi.ofTotal", { percent: formatPercent(share, lang) })}</p>}
            />
          );
        })}
        <KpiCard
          icon={Percent}
          iconClass="bg-primary/10 text-primary-text"
          label={t("kpi.utilization")}
          value={current.utilizationPct === null ? dash : formatPercent(current.utilizationPct, lang)}
          footer={<Change value={metrics.utilizationChangePts} unit="points" />}
        />
      </section>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("chart.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("chart.subtitle")}</p>
          </div>
          <ChannelLegend />
        </div>
        <div className="mt-4">
          <MonthlyRevenueChart data={current.monthly} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title={t("byPlatform.title")} subtitle={formatDayRange(range.from, range.to, lang)}>
          <PlatformDonut byChannel={current.byChannel} total={current.earningsCents} />
        </SectionCard>

        <SectionCard title={t("summary.title")} subtitle={formatDayRange(range.from, range.to, lang)}>
          <dl className="divide-y divide-border">
            {[
              { label: t("kpi.total"), value: current.earningsCents, strong: true },
              { label: t("kpi.wheelbase"), value: current.byChannel.wheelbase, color: CHANNEL_COLOR.wheelbase },
              { label: t("kpi.turo"), value: current.byChannel.turo, color: CHANNEL_COLOR.turo },
              { label: t("summary.averageMonthly"), value: metrics.averageMonthlyCents },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-2">
                  {row.color && <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: row.color }} aria-hidden="true" />}
                  {row.label}
                </dt>
                <dd className={cn("tabular-nums", row.strong && "font-semibold")}>
                  <bdi>{formatMoney(row.value, lang, true)}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title={t("metrics.title")} subtitle={formatDayRange(range.from, range.to, lang)}>
          <dl className="divide-y divide-border">
            {metricRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-3">
                  <row.icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {row.label}
                </dt>
                <dd className="font-semibold tabular-nums">
                  <bdi>{row.value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      </div>
    </main>
  );
}
