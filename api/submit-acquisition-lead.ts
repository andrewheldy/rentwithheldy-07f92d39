import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  AcquisitionSubmissionSchema,
  scoreDriverLead,
  toAcquisitionRow,
  type AcquisitionSubmission,
} from "../src/lib/acquisition-leads.js";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MIN_COMPLETION_MS = 1_200;
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type RateLimitStore = Map<string, number[]>;

declare global {
  // Best-effort per-instance rate limiting. The honeypot and server validation
  // remain effective across instances; a durable limiter can replace this later.
  var rwhAcquisitionRateLimits: RateLimitStore | undefined;
}

const rateLimits =
  globalThis.rwhAcquisitionRateLimits ??
  (globalThis.rwhAcquisitionRateLimits = new Map<string, number[]>());

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const humanize = (value: string | null | undefined) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "—";

function getClientIp(req: VercelRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (rateLimits.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimits.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimits.set(ip, recent);
  return false;
}

function notificationRows(submission: AcquisitionSubmission) {
  const contact: Array<[string, string]> = [
    ["Name", `${submission.firstName} ${submission.lastName}`],
    ["Phone", submission.phone],
    ["Email", submission.email],
    ["ZIP Code", submission.zipCode],
  ];

  if (submission.leadType === "driver_demand") {
    return [
      ...contact,
      ["Priority", scoreDriverLead(submission).toUpperCase()],
      ["Platforms", submission.platforms.map(humanize).join(", ")],
      ["Platform Interests", submission.platformSubtypes.map(humanize).join(", ") || "—"],
      ["Vehicle Category", humanize(submission.vehicleCategory)],
      ["Timeline", humanize(submission.needTimeline)],
      ["Weekly Budget", humanize(submission.weeklyBudget)],
      ["Driver Status", humanize(submission.driverStatus)],
      ["Current Platforms", submission.currentPlatforms.map(humanize).join(", ") || "—"],
      ["Expected Duration", humanize(submission.expectedDuration)],
      ["Empower Status", humanize(submission.empowerStatus)],
      ["Empower Referral Clicked", submission.empowerReferralClicked ? "Yes" : "No"],
      ["Landing Page", submission.landingPage],
      ["Source", submission.source || "direct"],
      ["Campaign", submission.campaign || "—"],
    ] as Array<[string, string]>;
  }

  return [
    ...contact,
    ["Vehicle", `${submission.vehicleYear} ${submission.vehicleMake} ${submission.vehicleModel}`],
    ["Trim", submission.vehicleTrim || "—"],
    ["Vehicle Type", humanize(submission.vehicleType)],
    ["Passenger Capacity", humanize(submission.passengerCapacity)],
    ["Mileage", submission.mileage.toLocaleString("en-US")],
    ["Condition", humanize(submission.vehicleCondition)],
    ["Ownership", humanize(submission.ownershipStatus)],
    ["Availability", humanize(submission.vehicleAvailability)],
    ["VIN", submission.vin ? "Provided — view securely in Supabase" : "Not provided"],
    ["Strategic Passenger Van", submission.vehicleType === "passenger_van" && submission.passengerCapacity === "12_14" ? "Yes" : "No"],
    ["Landing Page", submission.landingPage],
    ["Source", submission.source || "direct"],
    ["Campaign", submission.campaign || "—"],
  ] as Array<[string, string]>;
}

async function sendNotification(submission: AcquisitionSubmission) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const subject =
    submission.leadType === "driver_demand"
      ? `NEW DRIVER DEMAND — ${scoreDriverLead(submission).toUpperCase()}`
      : "NEW VEHICLE CONSIGNMENT LEAD";
  const rows = notificationRows(submission);
  const htmlRows = rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:8px 14px;font-weight:600;color:#374151;background:#f9fafb;border-bottom:1px solid #e5e7eb;">${escapeHtml(label)}</td>
        <td style="padding:8px 14px;color:#111827;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("");

  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;color:#111827;">${escapeHtml(subject)}</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">Submitted through rentwithheldy.com</p>
    <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;">${htmlRows}</table>
  </div>`;
  const text = [subject, "", ...rows.map(([label, value]) => `${label}: ${value}`)].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: ["rentwithheldy@gmail.com"],
    subject,
    html,
    text,
  });

  if (error) throw new Error(error.message);
  return { sent: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const contentLength = Number(req.headers["content-length"] ?? 0);
  if (contentLength > 64_000) {
    return res.status(413).json({ error: "Submission is too large" });
  }

  const parsed = AcquisitionSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Please review the highlighted information and try again.",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const submission = parsed.data;
  const elapsed = Date.now() - submission.startedAt;
  if (submission.website || elapsed < MIN_COMPLETION_MS || elapsed > MAX_DRAFT_AGE_MS) {
    return res.status(400).json({ error: "Unable to accept this submission." });
  }

  if (isRateLimited(getClientIp(req))) {
    res.setHeader("Retry-After", "900");
    return res.status(429).json({
      error: "Too many submissions. Please wait a few minutes and try again.",
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Acquisition lead submission is missing server-only Supabase configuration");
    return res.status(503).json({ error: "Lead service is temporarily unavailable." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const row = { ...toAcquisitionRow(submission), user_agent: req.headers["user-agent"] ?? null };
  const { error: insertError } = await supabase.from("acquisition_leads").insert(row);

  if (insertError) {
    console.error("Acquisition lead insert failed", insertError.code, insertError.message);
    return res.status(500).json({ error: "We could not save your request. Please try again." });
  }

  let notificationSent = false;
  try {
    const notification = await sendNotification(submission);
    notificationSent = notification.sent;
    if (!notification.sent) console.warn("Acquisition notification skipped", notification.reason);
  } catch (error) {
    console.error("Acquisition notification failed", error);
  }

  return res.status(201).json({ ok: true, notificationSent });
}
