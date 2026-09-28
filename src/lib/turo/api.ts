import { supabase } from "@/integrations/supabase/client";
import type { TuroImportResult } from "./result";

export const MAX_TURO_FILE_BYTES = 4_000_000;

export async function submitTuroExport(file: { name: string; text: string }, mode: "check" | "import"): Promise<TuroImportResult> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Your admin session has expired. Sign in again.");
  const response = await fetch("/api/turo-import", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ csv: file.text, fileName: file.name, mode }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "The import request failed.");
  return payload as TuroImportResult;
}

export type TuroImportRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "succeeded" | "failed";
  rows_upserted: number;
  error: string | null;
  metadata: {
    file_name?: string;
    trips?: number;
    new_trips?: number;
    updated_trips?: number;
    totals?: { earningsCents?: number };
    first_trip_start?: string | null;
    last_trip_start?: string | null;
  } | null;
};

export async function listTuroImports(): Promise<TuroImportRun[]> {
  const { data, error } = await supabase
    .from("sync_runs")
    .select("id, started_at, finished_at, status, rows_upserted, error, metadata")
    .eq("source", "turo")
    .order("started_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as unknown as TuroImportRun[];
}
