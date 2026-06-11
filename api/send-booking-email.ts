import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SUBJECT_MAP: Record<string, string> = {
  "body-shop-delivery": "New Booking Request - Body Shop Delivery",
  "airport-trip": "New Booking Request - Airport Trip",
  "hotel-guest": "New Booking Request - Hotel Guest",
  "cruise-passenger": "New Booking Request - Cruise Passenger",
  "partner-intake": "New Partner Request",
  "drive-to-own": "New Drive-to-Own Inquiry",
  "vehicle-inquiry": "New Vehicle Booking Inquiry",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    source,
    formType,
    passengerType,
    name,
    phone,
    email,
    company,
    claimNumber,
    location,
    when,
    startDate,
    endDate,
    referredBy,
    notes,
  } = req.body as Record<string, string | undefined>;

  if (!name || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const subject =
    SUBJECT_MAP[source ?? ""] ??
    `New Booking Request - ${source ?? formType ?? "Website"}`;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "short",
  });

  const rows: [string, string | undefined][] = [
    ["Page / Form Source", source ?? formType],
    ["Customer Type", passengerType],
    ["Full Name", name],
    ["Mobile Phone", phone],
    ["Email", email],
    ["Company / Firm", company],
    ["Client Claim #", claimNumber],
    ["Delivery Location", location],
    ["Requested Date / Time", when],
    ["Start Date", startDate],
    ["End Date", endDate],
    ["Referred By", referredBy],
    ["Additional Notes", notes],
    ["Submitted At", timestamp],
  ];

  const htmlRows = rows
    .filter(([, v]) => v)
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 14px;font-weight:600;white-space:nowrap;color:#374151;background:#f9fafb;border-bottom:1px solid #e5e7eb;">${label}</td>
          <td style="padding:8px 14px;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111827;">${subject}</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">
        New lead submitted via rentwithheldy.com
      </p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tbody>${htmlRows}</tbody>
      </table>
    </div>`;

  const text = rows
    .filter(([, v]) => v)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: ["rentwithheldy@gmail.com"],
    subject,
    html,
    text: `${subject}\n\n${text}`,
  });

  if (error) {
    console.error("Resend error", error);
    return res.status(500).json({ error: "Failed to send email" });
  }

  return res.status(200).json({ ok: true });
}
