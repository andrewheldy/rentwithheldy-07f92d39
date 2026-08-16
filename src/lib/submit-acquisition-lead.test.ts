import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ insert: mocks.insert }),
  }),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

import handler from "../../api/submit-acquisition-lead";

function responseHarness() {
  const result = { status: 200, body: undefined as unknown, headers: {} as Record<string, string> };
  const response = {
    setHeader: (name: string, value: string) => {
      result.headers[name] = value;
    },
    status: (status: number) => {
      result.status = status;
      return response;
    },
    json: (body: unknown) => {
      result.body = body;
      return response;
    },
  } as unknown as VercelResponse;
  return { response, result };
}

const driverBody = {
  leadType: "driver_demand",
  platforms: ["uber"],
  platformSubtypes: ["uber:uberx"],
  vehicleCategory: "everyday",
  needTimeline: "within_7_days",
  weeklyBudget: "350_399",
  driverStatus: "approved_need_vehicle",
  currentPlatforms: [],
  expectedDuration: "six_to_twelve_months",
  empowerStatus: null,
  empowerReferralClicked: false,
  firstName: "Alex",
  lastName: "Driver",
  phone: "5615550199",
  email: "alex@example.com",
  zipCode: "33301",
  source: "direct",
  campaign: null,
  referrer: null,
  landingPage: "/drive-for-work",
  website: "",
  startedAt: Date.now() - 10_000,
};

const vehicleBody = {
  leadType: "vehicle_supply",
  vehicleYear: 2024,
  vehicleMake: "Ford",
  vehicleModel: "Transit 350 HD",
  vehicleTrim: "XLT",
  vehicleType: "passenger_van",
  passengerCapacity: "12_14",
  mileage: 18_000,
  vehicleCondition: "excellent",
  ownershipStatus: "financed",
  vehicleAvailability: "most_of_month",
  vin: "1FTBW3XG5RKA12345",
  firstName: "Taylor",
  lastName: "Owner",
  phone: "5615550110",
  email: "owner@example.com",
  zipCode: "33101",
  source: "direct",
  campaign: null,
  referrer: null,
  landingPage: "/list-your-vehicle",
  website: "",
  startedAt: Date.now() - 10_000,
};

function request(body: unknown, ip: string): VercelRequest {
  return {
    method: "POST",
    body,
    headers: {
      "content-length": "1200",
      "x-forwarded-for": ip,
      "user-agent": "vitest",
    },
    socket: { remoteAddress: ip },
  } as unknown as VercelRequest;
}

describe("acquisition lead API", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "test-secret-key";
    process.env.RESEND_API_KEY = "test-resend-key";
    delete process.env.RESEND_FROM_EMAIL;
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.send.mockReset().mockResolvedValue({ error: null });
  });

  it("validates, stores structured data, and sends one operations notification", async () => {
    const { response, result } = responseHarness();
    await handler(request(driverBody, "192.0.2.10"), response);

    expect(result.status).toBe(201);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_type: "driver_demand",
        vehicle_category: "everyday",
        weekly_budget_min: 350,
        weekly_budget_max: 399,
        lead_priority: "hot",
      }),
    );
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "onboarding@resend.dev",
        to: ["rentwithheldy@gmail.com"],
        subject: "NEW DRIVER DEMAND — HOT",
      }),
    );
  });

  it("sends the vehicle funnel through the configured Resend sender without exposing the VIN", async () => {
    process.env.RESEND_FROM_EMAIL = "Rent With Heldy <leads@rentwithheldy.com>";
    const { response, result } = responseHarness();

    await handler(request(vehicleBody, "192.0.2.17"), response);

    expect(result.status).toBe(201);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_type: "vehicle_supply",
        vehicle_type: "passenger_van",
        strategic_interest: true,
        vin: "1FTBW3XG5RKA12345",
      }),
    );
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Rent With Heldy <leads@rentwithheldy.com>",
        to: ["rentwithheldy@gmail.com"],
        subject: "NEW VEHICLE CONSIGNMENT LEAD",
        html: expect.not.stringContaining("1FTBW3XG5RKA12345"),
        text: expect.not.stringContaining("1FTBW3XG5RKA12345"),
      }),
    );
  });

  it("rejects honeypot submissions before database access", async () => {
    const { response, result } = responseHarness();
    await handler(request({ ...driverBody, website: "spam.example" }, "192.0.2.11"), response);

    expect(result.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects missing conditional data before database access", async () => {
    const { response, result } = responseHarness();
    await handler(
      request({ ...driverBody, platforms: ["empower"], platformSubtypes: [], empowerStatus: null }, "192.0.2.12"),
      response,
    );

    expect(result.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("delivers through Resend when the backend-only Supabase key is not configured", async () => {
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { response, result } = responseHarness();

    await handler(request(driverBody, "192.0.2.13"), response);

    expect(result.status).toBe(201);
    expect(result.body).toEqual({ ok: true, stored: false, notificationSent: true });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it("delivers through Resend when database storage fails", async () => {
    mocks.insert.mockResolvedValueOnce({
      error: { code: "42P01", message: "acquisition_leads does not exist" },
    });
    const { response, result } = responseHarness();

    await handler(request(driverBody, "192.0.2.14"), response);

    expect(result.status).toBe(201);
    expect(result.body).toEqual({ ok: true, stored: false, notificationSent: true });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it("accepts a stored lead when Resend is temporarily unavailable", async () => {
    mocks.send.mockResolvedValueOnce({ error: { message: "Resend unavailable" } });
    const { response, result } = responseHarness();

    await handler(request(driverBody, "192.0.2.15"), response);

    expect(result.status).toBe(201);
    expect(result.body).toEqual({ ok: true, stored: true, notificationSent: false });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("returns an actionable error only when both capture paths fail", async () => {
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.RESEND_API_KEY;
    const { response, result } = responseHarness();

    await handler(request(driverBody, "192.0.2.16"), response);

    expect(result.status).toBe(503);
    expect(result.body).toEqual({
      error: "We couldn't send your request. Please try again or call us directly.",
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
