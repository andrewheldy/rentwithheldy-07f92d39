import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadOwnerData, type OwnerData } from "@/lib/owner/api";
import { dashboardMetrics, presetRange, type DashboardMetrics, type DateRange, type RangePreset } from "@/lib/owner/metrics";
import { todayISO } from "@/lib/consigners/format";

export const ALL_VEHICLES = "all";

type OwnerDashboardState = {
  data: OwnerData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  /** Set when an admin is previewing a consigner's dashboard. */
  previewConsignerId: string | null;
  /** Adds the preview parameter to an owner link. */
  ownerPath: (path: string) => string;
  vehicleId: string;
  setVehicleId: (id: string) => void;
  preset: RangePreset;
  setPreset: (preset: RangePreset) => void;
  range: DateRange;
  metrics: DashboardMetrics | null;
  /** Vehicles in the current selection. */
  selectedVehicles: OwnerData["vehicles"];
  today: string;
};

const OwnerDashboardContext = createContext<OwnerDashboardState | null>(null);

export function OwnerDashboardProvider({ previewConsignerId, children }: { previewConsignerId: string | null; children: ReactNode }) {
  const today = todayISO();
  const [vehicleId, setVehicleId] = useState(ALL_VEHICLES);
  const [preset, setPreset] = useState<RangePreset>("thisYear");
  const query = useQuery({
    queryKey: ["owner-dashboard", previewConsignerId ?? "self"],
    queryFn: () => loadOwnerData(previewConsignerId ?? undefined),
    retry: false,
  });
  const data = query.data;

  const value = useMemo<OwnerDashboardState>(() => {
    const selectedIds = new Set(
      data ? (vehicleId === ALL_VEHICLES ? data.vehicles.map((v) => v.id) : [vehicleId]) : [],
    );
    const earliest = data?.consignments.map((c) => c.effective_from).sort()[0] ?? null;
    const range = presetRange(preset, today, earliest);
    const metrics = data
      ? dashboardMetrics(
          {
            consignments: data.consignments.filter((c) => selectedIds.has(c.vehicle_id)),
            vehicles: data.vehicles.filter((v) => selectedIds.has(v.id)),
            bookings: data.bookings.filter((b) => selectedIds.has(b.vehicle_id)),
            transactions: data.transactions.filter((t) => selectedIds.has(t.vehicle_id)),
            unavailable: data.unavailable.filter((u) => selectedIds.has(u.vehicle_id)),
            today,
          },
          range,
        )
      : null;
    return {
      data,
      isLoading: query.isLoading,
      error: query.error as Error | null,
      refetch: () => void query.refetch(),
      previewConsignerId,
      ownerPath: (path) => (previewConsignerId ? `${path}?as=${encodeURIComponent(previewConsignerId)}` : path),
      vehicleId,
      setVehicleId,
      preset,
      setPreset,
      range,
      metrics,
      selectedVehicles: data?.vehicles.filter((v) => selectedIds.has(v.id)) ?? [],
      today,
    };
  }, [data, preset, previewConsignerId, query, today, vehicleId]);

  return <OwnerDashboardContext.Provider value={value}>{children}</OwnerDashboardContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOwnerDashboard() {
  const context = useContext(OwnerDashboardContext);
  if (!context) throw new Error("useOwnerDashboard must be used inside OwnerDashboardProvider");
  return context;
}
