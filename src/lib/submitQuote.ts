const TIMEOUT_MS = 10_000;

export interface QuotePayload {
  source: string;
  formType?: string;
  passengerType?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  claimNumber?: string;
  location?: string;
  when?: string;
  startDate?: string;
  endDate?: string;
  referredBy?: string;
  notes?: string;
}

export async function submitQuote(payload: QuotePayload): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/send-booking-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
