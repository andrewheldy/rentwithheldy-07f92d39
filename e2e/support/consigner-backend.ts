import type { Page, Route } from "@playwright/test";
import { SUPABASE, adminUser } from "./blog-backend";

/*
 * In-memory stand-in for the Supabase endpoints the admin consigner screens
 * use: the admin_list_users / admin_assign_vehicle functions, consigners with
 * embedded consignments + vehicles, the vehicle and agreement pickers, and
 * user_roles. It mirrors the database rules that matter for the UI: accounts
 * must be confirmed, a vehicle can't have two overlapping owners, the split
 * always adds up to 100, and assigning grants the consigner role.
 */

const ADMIN_TOKEN = "playwright-admin-token";
const CUSTOMER_TOKEN = "playwright-customer-token";

export const customerUser = {
  ...adminUser,
  id: "44444444-4444-4444-8444-444444444444",
  email: "guest@example.com",
};

type Row = Record<string, unknown>;

export const JETTA = {
  id: "veh-jetta",
  year: 2019,
  make: "Volkswagen",
  model: "Jetta",
  color: "White",
  license_plate: "STLN58",
  vin: "3VWE57BU1KM119169",
  fleet_status: "active",
  in_service_on: "2026-09-17",
};

export const EQUINOX = {
  id: "veh-equinox",
  year: 2020,
  make: "Chevrolet",
  model: "Equinox",
  color: "Black",
  license_plate: "ABC123",
  vin: "2GNAXKEV0L6000000",
  fleet_status: "active",
  in_service_on: null,
};

export const OWNER_ACCOUNT = {
  user_id: "22222222-2222-4222-8222-222222222222",
  email: "owner@example.com",
  full_name: "Test Owner",
  providers: ["google"],
  created_at: "2026-09-20T12:00:00.000Z",
  last_sign_in_at: "2026-09-24T12:00:00.000Z",
  email_confirmed: true,
  is_admin: false,
};

export const UNCONFIRMED_ACCOUNT = {
  user_id: "33333333-3333-4333-8333-333333333333",
  email: "pending@example.com",
  full_name: "Pending Person",
  providers: ["email"],
  created_at: "2026-09-21T12:00:00.000Z",
  last_sign_in_at: null,
  email_confirmed: false,
  is_admin: false,
};

export class ConsignerBackend {
  accounts: Row[] = [
    OWNER_ACCOUNT,
    UNCONFIRMED_ACCOUNT,
    {
      user_id: adminUser.id,
      email: adminUser.email,
      full_name: "Admin",
      providers: ["email"],
      created_at: "2026-01-01T00:00:00.000Z",
      last_sign_in_at: "2026-09-25T12:00:00.000Z",
      email_confirmed: true,
      is_admin: true,
    },
  ];
  vehicles: Row[] = [EQUINOX, JETTA];
  consigners: Row[] = [];
  consignments: Row[] = [];
  consignerRoles = new Set<string>();
  assignCalls: Row[] = [];
  profileSaves: Row[] = [];

  private consignerFor(userId: string) {
    return this.consigners.find((c) => c.user_id === userId);
  }

  private listAccounts() {
    return this.accounts.map((a) => ({
      ...a,
      is_consigner: this.consignerRoles.has(String(a.user_id)),
      consigner_id: this.consignerFor(String(a.user_id))?.id ?? null,
    }));
  }

  private listConsigners() {
    return this.consigners.map((c) => ({
      ...c,
      assignments: this.consignments
        .filter((cs) => cs.consigner_id === c.id)
        .map((cs) => {
          const v = this.vehicles.find((vehicle) => vehicle.id === cs.vehicle_id);
          return {
            ...cs,
            vehicle: v ? { id: v.id, year: v.year, make: v.make, model: v.model, color: v.color, license_plate: v.license_plate } : null,
          };
        }),
    }));
  }

  private assign(args: Row) {
    const userId = String(args.p_user_id);
    const pct = Number(args.p_owner_percent);
    const from = String(args.p_effective_from);
    const account = this.accounts.find((a) => a.user_id === userId);
    if (!account) return { status: 400, body: { code: "P0002", message: "That account no longer exists." } };
    if (!(pct >= 0 && pct <= 100)) {
      return { status: 400, body: { code: "22023", message: "The owner's share must be between 0 and 100 percent." } };
    }
    const overlapping = this.consignments.some(
      (cs) => cs.vehicle_id === args.p_vehicle_id && (cs.effective_to === null || String(cs.effective_to) >= from),
    );
    if (overlapping) {
      return {
        status: 409,
        body: { code: "23P01", message: "This vehicle is already assigned to an owner for part of that period. End that assignment first." },
      };
    }
    let consigner = this.consignerFor(userId);
    if (!consigner) {
      consigner = {
        id: `con-${this.consigners.length + 1}`,
        user_id: userId,
        legal_name: String(args.p_legal_name).trim(),
        email: account.email,
        phone: args.p_phone ?? null,
        status: "active",
        created_at: new Date().toISOString(),
      };
      this.consigners.push(consigner);
    }
    const id = `cs-${this.consignments.length + 1}`;
    this.consignments.push({
      id,
      consigner_id: consigner.id,
      vehicle_id: args.p_vehicle_id,
      agreement_id: args.p_agreement_id ?? null,
      owner_percent: pct,
      operator_percent: Math.round((100 - pct) * 100) / 100,
      effective_from: from,
      effective_to: null,
      status: "active",
    });
    this.consignerRoles.add(userId);
    return { status: 200, body: id };
  }

  async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const authorization = request.headers()["authorization"] ?? "";
    const admin = authorization.includes(ADMIN_TOKEN);
    const customer = authorization.includes(CUSTOMER_TOKEN);
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", headers: { "content-range": "0-0/*" }, body: JSON.stringify(body) });
    const body = () => {
      const data = request.postData();
      return data ? JSON.parse(data) : null;
    };
    const params = url.searchParams;

    if (path === "/auth/v1/user") {
      if (admin) return json(adminUser);
      if (customer) return json(customerUser);
      return json({ message: "no session" }, 401);
    }
    if (path === "/auth/v1/logout") return route.fulfill({ status: 204 });

    if (path === "/rest/v1/user_roles") {
      if (method === "GET") return json(admin && params.get("role") === "eq.admin" ? [{ role: "admin" }] : []);
      if (!admin) return json({ code: "42501", message: "permission denied" }, 403);
      if (method === "POST") {
        const rows = [body()].flat() as Row[];
        rows.forEach((r) => this.consignerRoles.add(String(r.user_id)));
        return json(rows, 201);
      }
      if (method === "DELETE") {
        this.consignerRoles.delete(String(params.get("user_id")).replace(/^eq\./, ""));
        return route.fulfill({ status: 204 });
      }
    }

    if (path === "/rest/v1/rpc/admin_list_users") return json(admin ? this.listAccounts() : []);
    if (path === "/rest/v1/rpc/admin_assign_vehicle") {
      if (!admin) return json({ code: "42501", message: "Only admins can assign vehicles." }, 403);
      const args = body() as Row;
      this.assignCalls.push(args);
      const result = this.assign(args);
      return json(result.body, result.status);
    }

    if (path === "/rest/v1/consigners") return json(admin ? this.listConsigners() : []);
    if (path === "/rest/v1/vehicles") {
      if (!admin) return json([]);
      // The photo manager embeds images; the vehicle picker doesn't.
      const embedImages = (params.get("select") ?? "").includes("vehicle_images");
      return json(this.vehicles.map((v) => (embedImages ? { ...v, vehicle_images: [] } : v)));
    }
    if (path === "/rest/v1/agreements") return json([]);
    if (path === "/rest/v1/profiles") {
      if (!admin && !customer) return json([]);
      if (method === "GET") {
        return json([{ full_name: admin ? "Admin Person" : "Guest Person", phone: null, preferred_language: "en", marketing_opt_in: false }]);
      }
      if (method === "POST") {
        const row = body() as Row;
        this.profileSaves.push(row);
        return json([row], 201);
      }
    }
    if (path === "/rest/v1/consignments" && method === "PATCH") {
      const id = String(params.get("id")).replace(/^eq\./, "");
      const patch = body() as Row;
      const row = this.consignments.find((cs) => cs.id === id);
      if (row) Object.assign(row, patch);
      return route.fulfill({ status: 204 });
    }

    // Other admin screens reached through the sidebar: empty lists are enough.
    if (method === "GET" && path.startsWith("/rest/v1/")) return json([]);
    return json({}, 404);
  }

  async install(page: Page, { asAdmin, asCustomer = false }: { asAdmin: boolean; asCustomer?: boolean }) {
    if (asAdmin || asCustomer) {
      await page.addInitScript(({ user, token }) => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3_600;
        localStorage.setItem(
          "sb-example-auth-token",
          JSON.stringify({ access_token: token, refresh_token: "refresh", token_type: "bearer", expires_in: 3_600, expires_at: expiresAt, user }),
        );
      }, asAdmin ? { user: adminUser, token: ADMIN_TOKEN } : { user: customerUser, token: CUSTOMER_TOKEN });
    }
    await page.route(`${SUPABASE}/**`, (route) => this.handle(route));
  }
}
