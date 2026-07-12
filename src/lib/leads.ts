import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

/**
 * Every lead-capture form already handles `{ error }` from a normal
 * Supabase response (log it, fall through to the email-send flow). But an
 * unconfigured Supabase client (see integrations/supabase/client.ts) throws
 * synchronously instead of resolving with an error — this wraps that so it
 * surfaces as the same `{ error }` shape callers already know how to handle,
 * instead of an unhandled rejection that leaves the form stuck mid-submit.
 */
export async function insertLead(
  payload: LeadInsert,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from("leads").insert(payload);
    return { error: error ? new Error(error.message) : null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
