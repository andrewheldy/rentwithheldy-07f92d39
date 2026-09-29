import type { Page, Route } from "@playwright/test";
import { SUPABASE, adminUser } from "./blog-backend";

/*
 * In-memory stand-in for the Supabase reads the owner dashboard makes, for a
 * signed-in consigner (or an admin previewing with ?as=). RLS is mirrored where
 * it matters: a consigner only gets their own consigner row, consignments,
 * vehicles and executed agreements.
 */

const OWNER_TOKEN = "playwright-owner-token";
const ADMIN_TOKEN = "playwright-admin-token";

export const ownerUser = {
  ...adminUser,
  id: "55555555-5555-4555-8555-555555555555",
  email: "owner@example.com",
};

type Row = Record<string, unknown>;

export const JETTA_ID = "veh-jetta";
export const CONSIGNER_ID = "con-1";

/** A year of trips: one Turo and (from March) one Wheelbase trip a month, Jan–Sep 2026. */
function tripsFor2026() {
  const bookings: Row[] = [];
  const transactions: Row[] = [];
  for (let month = 1; month <= 9; month += 1) {
    const mm = String(month).padStart(2, "0");
    const turoId = `t-${mm}`;
    bookings.push({ id: turoId, vehicle_id: JETTA_ID, source: "turo", start_at: `2026-${mm}-05T15:00:00Z`, end_at: `2026-${mm}-09T15:00:00Z`, status: "completed" });
    transactions.push({ vehicle_id: JETTA_ID, source: "turo", booking_id: turoId, collected_on: `2026-${mm}-09`, rental_revenue_cents: 40000 + month * 1000 });
    if (month >= 3) {
      const wbId = `w-${mm}`;
      bookings.push({ id: wbId, vehicle_id: JETTA_ID, source: "wheelbase", start_at: `2026-${mm}-15T15:00:00Z`, end_at: `2026-${mm}-21T15:00:00Z`, status: "completed" });
      transactions.push({ vehicle_id: JETTA_ID, source: "wheelbase", booking_id: wbId, collected_on: `2026-${mm}-21`, rental_revenue_cents: 60000 });
    }
  }
  // A trip from before the consignment: never the owner's.
  bookings.push({ id: "old", vehicle_id: JETTA_ID, source: "turo", start_at: "2025-12-01T15:00:00Z", end_at: "2025-12-04T15:00:00Z", status: "completed" });
  transactions.push({ vehicle_id: JETTA_ID, source: "turo", booking_id: "old", collected_on: "2025-12-04", rental_revenue_cents: 99900 });
  return { bookings, transactions };
}

export class OwnerBackend {
  consigners: Row[] = [{ id: CONSIGNER_ID, user_id: ownerUser.id, legal_name: "Jordan Owner" }];
  consignments: Row[] = [
    { consigner_id: CONSIGNER_ID, vehicle_id: JETTA_ID, owner_percent: "60.00", effective_from: "2026-01-01", effective_to: null, agreement_id: "agr-1" },
  ];
  vehicles: Row[] = [
    {
      id: JETTA_ID,
      year: 2019,
      make: "Volkswagen",
      model: "Jetta",
      color: "White",
      license_plate: "STLN58",
      vin: "3VWE57BU1KM119169",
      in_service_on: "2026-01-01",
      out_of_service_on: null,
      vehicle_images: [],
    },
  ];
  bookings: Row[];
  transactions: Row[];
  unavailable: Row[] = [{ vehicle_id: JETTA_ID, starts_on: "2026-06-10", ends_on: "2026-06-14" }];
  agreements: Row[] = [
    { id: "agr-1", consigner_id: CONSIGNER_ID, status: "executed", agreement_number: "CON-2026-0001", executed_at: "2025-12-20T18:00:00Z", final_pdf_path: "agr-1/final.pdf" },
  ];
  roles = new Set(["consigner"]);
  signedPaths: string[] = [];

  constructor() {
    const { bookings, transactions } = tripsFor2026();
    this.bookings = bookings;
    this.transactions = transactions;
  }

  async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const auth = request.headers()["authorization"] ?? "";
    const owner = auth.includes(OWNER_TOKEN);
    const admin = auth.includes(ADMIN_TOKEN);
    const params = url.searchParams;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", headers: { "content-range": "0-0/*" }, body: JSON.stringify(body) });
    const eq = (key: string) => params.get(key)?.replace(/^eq\./, "");
    const inList = (key: string) =>
      params
        .get(key)
        ?.replace(/^in\.\(|\)$/g, "")
        .split(",")
        .map((v) => v.replace(/^"|"$/g, ""));

    if (path === "/auth/v1/user") {
      if (owner) return json(ownerUser);
      if (admin) return json(adminUser);
      return json({ message: "no session" }, 401);
    }
    if (path === "/auth/v1/logout") return route.fulfill({ status: 204 });
    if (path === "/rest/v1/user_roles") {
      if (admin) return json([{ role: "admin" }]);
      return json(owner ? [...this.roles].map((role) => ({ role })) : []);
    }
    if (!owner && !admin) return json([]);

    // RLS: a consigner sees only their own consigner row and what hangs off it.
    const mine = (rows: Row[]) => (admin ? rows : rows.filter((r) => r.user_id === ownerUser.id));
    if (path === "/rest/v1/consigners") {
      const id = eq("id");
      const userId = eq("user_id");
      return json(mine(this.consigners).filter((r) => (!id || r.id === id) && (!userId || r.user_id === userId)));
    }
    if (path === "/rest/v1/consignments") return json(this.consignments.filter((r) => r.consigner_id === eq("consigner_id")));
    const vehicleIds = inList("vehicle_id") ?? inList("id") ?? [];
    if (path === "/rest/v1/vehicles") return json(this.vehicles.filter((r) => vehicleIds.includes(String(r.id))));
    if (path === "/rest/v1/rental_bookings") return json(this.bookings.filter((r) => vehicleIds.includes(String(r.vehicle_id))));
    if (path === "/rest/v1/rental_transactions") return json(this.transactions.filter((r) => vehicleIds.includes(String(r.vehicle_id))));
    if (path === "/rest/v1/vehicle_unavailable_periods") return json(this.unavailable.filter((r) => vehicleIds.includes(String(r.vehicle_id))));
    if (path === "/rest/v1/agreements") {
      return json(this.agreements.filter((r) => r.consigner_id === eq("consigner_id") && r.status === eq("status")));
    }
    if (path === "/rest/v1/profiles") {
      return json([{ full_name: "Jordan Owner", phone: null, preferred_language: "en", marketing_opt_in: false }]);
    }
    if (path.startsWith("/storage/v1/object/sign/agreements/")) {
      const objectPath = path.replace("/storage/v1/object/sign/agreements/", "");
      this.signedPaths.push(objectPath);
      return json({ signedURL: `/object/sign/agreements/${objectPath}?token=signed` });
    }
    if (path.startsWith("/storage/v1/object/sign/")) {
      return route.fulfill({ status: 200, contentType: "application/pdf", body: "%PDF-1.4\n%fake\n" });
    }
    return json([]);
  }

  async install(page: Page, { as }: { as: "owner" | "admin" | "customer" }) {
    const token = as === "owner" ? OWNER_TOKEN : as === "admin" ? ADMIN_TOKEN : "playwright-customer-token";
    if (as === "customer") this.roles.clear();
    const user = as === "admin" ? adminUser : ownerUser;
    await page.addInitScript(
      ({ user, token }) => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3_600;
        localStorage.setItem(
          "sb-example-auth-token",
          JSON.stringify({ access_token: token, refresh_token: "refresh", token_type: "bearer", expires_in: 3_600, expires_at: expiresAt, user }),
        );
      },
      { user, token: as === "customer" ? OWNER_TOKEN : token },
    );
    await page.route(`${SUPABASE}/**`, (route) => this.handle(route));
  }
}
