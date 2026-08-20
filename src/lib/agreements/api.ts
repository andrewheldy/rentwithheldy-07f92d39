import { supabase } from "@/integrations/supabase/client";

async function adminHeaders() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Your admin session has expired.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session.access_token}`,
  };
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "The agreement request failed.");
  return payload;
}

export async function getAgreements() {
  return parseResponse(await fetch("/api/agreements", { headers: await adminHeaders(), cache: "no-store" }));
}

export async function getAgreement(id: string) {
  return parseResponse(await fetch(`/api/agreements?id=${encodeURIComponent(id)}`, { headers: await adminHeaders(), cache: "no-store" }));
}

export async function getAgreementTemplates() {
  return parseResponse(await fetch("/api/agreements?resource=templates", { headers: await adminHeaders(), cache: "no-store" }));
}

export async function saveAgreement(body: Record<string, unknown>) {
  return parseResponse(
    await fetch("/api/agreements", {
      method: "POST",
      headers: await adminHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function agreementAction(body: Record<string, unknown>) {
  return parseResponse(
    await fetch("/api/agreement-actions", {
      method: "POST",
      headers: await adminHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function signingAction(body: Record<string, unknown>) {
  return parseResponse(
    await fetch("/api/signing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      referrerPolicy: "no-referrer",
    }),
  );
}
