import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Channel, MonthPoint } from "@/lib/owner/metrics";
import { CHANNEL_COLOR, PLATFORM_NAME } from "@/lib/owner/channels";
import { formatMoney, formatMoneyCompact, formatMonth, formatPercent, shareOf } from "@/lib/owner/format";

// Wheelbase first (bottom of each stack), Turo on top — the mockup's order.
const STACK: Channel[] = ["wheelbase", "turo"];
const SURFACE = "hsl(var(--card))";


export function ChannelSwatch({ channel }: { channel: Channel }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHANNEL_COLOR[channel] }} aria-hidden="true" />;
}

export function ChannelLegend() {
  const { t } = useTranslation("owner");
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-foreground">
      {STACK.map((channel) => (
        <li key={channel} className="flex items-center gap-2">
          <ChannelSwatch channel={channel} />
          <span dir="ltr">{t(`channels.${channel}`)}</span>
        </li>
      ))}
    </ul>
  );
}

type TooltipPayload = { payload?: MonthPoint };

function MonthTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  const { t, i18n } = useTranslation("owner");
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="min-w-52 rounded-lg border border-border bg-card p-3 text-sm shadow-lg" dir={i18n.dir()}>
      <p className="text-muted-foreground">{formatMonth(point.month, i18n.language, "long")}</p>
      <p className="mt-1 text-muted-foreground">{t("kpi.total")}</p>
      <p className="text-xl font-semibold tabular-nums">
        <bdi>{formatMoney(point.total, i18n.language, true)}</bdi>
      </p>
      <ul className="mt-2 space-y-1">
        {[...STACK].reverse().map((channel) => {
          const share = shareOf(point[channel], point.total);
          return (
            <li key={channel} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <ChannelSwatch channel={channel} />
                <span dir="ltr">{PLATFORM_NAME[channel]}</span>
              </span>
              <span className="tabular-nums">
                <bdi>{formatMoney(point[channel], i18n.language, true)}</bdi>
                {share !== null && (
                  <bdi className="ms-1 text-muted-foreground">({formatPercent(share, i18n.language)})</bdi>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MonthlyRevenueChart({ data }: { data: MonthPoint[] }) {
  const { t, i18n } = useTranslation("owner");
  const hasEarnings = data.some((point) => point.total > 0);
  return (
    <div>
      {/* The plot is always left-to-right (time runs left to right in every locale). */}
      <div dir="ltr" className="h-72 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval="preserveStartEnd"
              minTickGap={8}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(month: string) => formatMonth(month, i18n.language)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(cents: number) => formatMoneyCompact(cents, i18n.language)}
              allowDecimals={false}
            />
            <Tooltip content={<MonthTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
            {STACK.map((channel, index) => (
              <Bar
                key={channel}
                dataKey={channel}
                stackId="earnings"
                fill={CHANNEL_COLOR[channel]}
                stroke={SURFACE}
                strokeWidth={2}
                maxBarSize={72}
                radius={index === STACK.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!hasEarnings && <p className="mt-2 text-center text-sm text-muted-foreground">{t("chart.empty")}</p>}
      {/* A table ignores the 1px box sr-only sets, so the wrapper carries it. */}
      <div className="sr-only">
        <table>
          <caption>{t("chart.tableCaption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("chart.month")}</th>
              <th scope="col">{t("channels.wheelbase")}</th>
              <th scope="col">{t("channels.turo")}</th>
              <th scope="col">{t("kpi.total")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.month}>
                <th scope="row">{formatMonth(point.month, i18n.language, "long")}</th>
                <td>{formatMoney(point.wheelbase, i18n.language, true)}</td>
                <td>{formatMoney(point.turo, i18n.language, true)}</td>
                <td>{formatMoney(point.total, i18n.language, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PlatformDonut({ byChannel, total }: { byChannel: Record<Channel, number>; total: number }) {
  const { t, i18n } = useTranslation("owner");
  const slices = STACK.map((channel) => ({ channel, value: byChannel[channel] })).filter((slice) => slice.value > 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-44 w-44 shrink-0" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices.length > 0 ? slices : [{ channel: "none", value: 1 }]}
              dataKey="value"
              nameKey="channel"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke={SURFACE}
              strokeWidth={slices.length > 1 ? 2 : 0}
              isAnimationActive={false}
            >
              {(slices.length > 0 ? slices : [{ channel: "none" }]).map((slice) => (
                <Cell key={slice.channel} fill={slice.channel === "none" ? "hsl(var(--muted))" : CHANNEL_COLOR[slice.channel as Channel]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" dir={i18n.dir()}>
          <bdi className="text-xl font-semibold tabular-nums">{formatMoney(total, i18n.language)}</bdi>
          <span className="text-xs text-muted-foreground">{t("kpi.total")}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 divide-y divide-border">
        {[...STACK].map((channel) => {
          const share = shareOf(byChannel[channel], total);
          return (
            <li key={channel} className="py-2.5 first:pt-0 last:pb-0">
              <p className="flex items-center gap-2 text-sm">
                <ChannelSwatch channel={channel} />
                <span dir="ltr">{t(`channels.${channel}`)}</span>
              </p>
              <p className="mt-0.5 ps-[18px]">
                <bdi className="text-lg font-semibold tabular-nums">{formatMoney(byChannel[channel], i18n.language)}</bdi>
                {share !== null && <bdi className="ms-2 text-sm text-muted-foreground">{formatPercent(share, i18n.language)}</bdi>}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
