import { Resend } from "npm:resend@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
  } = body as Record<string, string | undefined>;

  if (!name || !phone) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const subjectMap: Record<string, string> = {
    "body-shop-delivery": "New Booking Request - Body Shop Delivery",
    "airport-trip": "New Booking Request - Airport Trip",
    "hotel-guest": "New Booking Request - Hotel Guest",
    "cruise-passenger": "New Booking Request - Cruise Passenger",
    "partner-intake": "New Partner Request",
    "drive-to-own": "New Drive-to-Own Inquiry",
    "vehicle-inquiry": "New Vehicle Booking Inquiry",
  };
  const subject = subjectMap[source ?? ""] ?? `New Booking Request - ${source ?? formType ?? "Website"}`;

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
        `<tr><td style="padding:6px 12px;font-weight:600;white-space:nowrap;color:#374151;">${label}</td><td style="padding:6px 12px;color:#111827;">${value}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111827;">${subject}</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">New lead submitted via rentwithheldy.com</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tbody>${htmlRows}</tbody>
      </table>
    </div>`;

  const textRows = rows
    .filter(([, v]) => v)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const resend = new Resend(apiKey);
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: ["rentwithheldy@gmail.com"],
    subject,
    html,
    text: `${subject}\n\n${textRows}`,
  });

  if (error) {
    console.error("Resend error", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
