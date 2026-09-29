import { supabase } from "@/integrations/supabase/client";
import type { Booking, Consignment, Transaction, UnavailablePeriod } from "./metrics";

// Loads everything the owner dashboard shows. A consigner's reads are limited
// by RLS to their own vehicles and consignment dates; an admin previewing a
// dashboard (asConsignerId) can read everything, so every query is also
// filtered to that consigner's vehicles, and metrics.ts clips to their dates.

export type OwnerVehicleDetail = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string | null;
  license_plate: string | null;
  vin: string | null;
  in_service_on: string | null;
  out_of_service_on: string | null;
  photoUrl: string | null;
};

export type OwnerAgreement = {
  id: string;
  agreement_number: string;
  executed_at: string | null;
  final_pdf_path: string | null;
};

export type OwnerData = {
  consigner: { id: string; legal_name: string };
  consignments: Array<Consignment & { agreement_id: string | null }>;
  vehicles: OwnerVehicleDetail[];
  bookings: Booking[];
  transactions: Transaction[];
  unavailable: UnavailablePeriod[];
  agreements: OwnerAgreement[];
};

export class NotAnOwnerError extends Error {
  constructor() {
    super("This account isn't linked to a vehicle yet.");
  }
}

const PAGE = 1000;

/** Reads every page of a query (PostgREST returns at most 1,000 rows per request). */
async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

type VehicleRow = Omit<OwnerVehicleDetail, "photoUrl"> & {
  vehicle_images: Array<{ image_url: string; is_primary: boolean | null }> | null;
};

export async function loadOwnerData(asConsignerId?: string): Promise<OwnerData> {
  let consignerQuery = supabase.from("consigners").select("id, legal_name");
  if (asConsignerId) consignerQuery = consignerQuery.eq("id", asConsignerId);
  else {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new NotAnOwnerError();
    consignerQuery = consignerQuery.eq("user_id", auth.user.id);
  }
  const { data: consigner, error: consignerError } = await consignerQuery.maybeSingle();
  if (consignerError) throw consignerError;
  if (!consigner) throw new NotAnOwnerError();

  const { data: consignmentRows, error: consignmentError } = await supabase
    .from("consignments")
    .select("vehicle_id, owner_percent, effective_from, effective_to, agreement_id")
    .eq("consigner_id", consigner.id)
    .order("effective_from");
  if (consignmentError) throw consignmentError;
  const consignments = (consignmentRows ?? []).map((row) => ({ ...row, owner_percent: Number(row.owner_percent) }));
  const vehicleIds = [...new Set(consignments.map((c) => c.vehicle_id))];

  const empty = { consigner, consignments, vehicles: [], bookings: [], transactions: [], unavailable: [], agreements: [] };
  if (vehicleIds.length === 0) return empty;

  const [vehicleRows, bookings, transactions, unavailable, agreements] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, year, make, model, color, license_plate, vin, in_service_on, out_of_service_on, vehicle_images(image_url, is_primary)")
      .in("id", vehicleIds)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as unknown as VehicleRow[];
      }),
    readAll<Booking>((from, to) =>
      supabase
        .from("rental_bookings")
        .select("id, vehicle_id, source, start_at, end_at, status")
        .in("vehicle_id", vehicleIds)
        .order("start_at")
        .range(from, to),
    ),
    readAll<Transaction>((from, to) =>
      supabase
        .from("rental_transactions")
        .select("vehicle_id, source, booking_id, collected_on, rental_revenue_cents")
        .in("vehicle_id", vehicleIds)
        .order("collected_on")
        .range(from, to),
    ),
    supabase
      .from("vehicle_unavailable_periods")
      .select("vehicle_id, starts_on, ends_on")
      .in("vehicle_id", vehicleIds)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as UnavailablePeriod[];
      }),
    supabase
      .from("agreements")
      .select("id, agreement_number, executed_at, final_pdf_path")
      .eq("consigner_id", consigner.id)
      .eq("status", "executed")
      .order("executed_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as OwnerAgreement[];
      }),
  ]);

  const vehicles = vehicleRows.map(({ vehicle_images, ...vehicle }) => {
    const images = vehicle_images ?? [];
    const photo = images.find((image) => image.is_primary) ?? images[0];
    return { ...vehicle, photoUrl: photo?.image_url ?? null };
  });

  return { consigner, consignments, vehicles, bookings, transactions, unavailable, agreements };
}

/** A short-lived link to the signed agreement PDF. */
export async function agreementDownloadUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("agreements").createSignedUrl(path, 60);
  if (error || !data) throw error ?? new Error("Could not create the download link.");
  return data.signedUrl;
}
