import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Admin data access for consigners. Reads and simple writes rely on RLS
// (has_role 'admin'); account listing and the multi-table "assign vehicle"
// step go through admin-only database functions
// (supabase/migrations/20260925155439_admin_consigner_access.sql).

export type AdminAccount = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];

export type AssignmentVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  license_plate: string | null;
};

export type Assignment = {
  id: string;
  vehicle_id: string;
  agreement_id: string | null;
  owner_percent: number;
  operator_percent: number;
  effective_from: string;
  effective_to: string | null;
  status: string;
  vehicle: AssignmentVehicle | null;
};

export type Consigner = {
  id: string;
  user_id: string | null;
  legal_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  assignments: Assignment[];
};

export type AssignableVehicle = AssignmentVehicle & {
  vin: string | null;
  fleet_status: string;
  in_service_on: string | null;
};

export type LinkableAgreement = {
  id: string;
  agreement_number: string;
  status: string;
  created_at: string;
  consigner_id: string | null;
  template: { name: string } | null;
};

const VEHICLE_COLUMNS = "id,year,make,model,color,license_plate";

export async function listAccounts(): Promise<AdminAccount[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data ?? [];
}

export async function listConsigners(): Promise<Consigner[]> {
  const { data, error } = await supabase
    .from("consigners")
    .select(
      `id,user_id,legal_name,email,phone,status,created_at,assignments:consignments(id,vehicle_id,agreement_id,owner_percent,operator_percent,effective_from,effective_to,status,vehicle:vehicles(${VEHICLE_COLUMNS}))`,
    )
    .order("legal_name");
  if (error) throw error;
  return ((data ?? []) as unknown as Consigner[]).map((consigner) => ({
    ...consigner,
    assignments: [...(consigner.assignments ?? [])]
      .map((assignment) => ({
        ...assignment,
        owner_percent: Number(assignment.owner_percent),
        operator_percent: Number(assignment.operator_percent),
      }))
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from)),
  }));
}

export async function listAssignableVehicles(): Promise<AssignableVehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(`${VEHICLE_COLUMNS},vin,fleet_status,in_service_on`)
    .neq("fleet_status", "retired")
    .order("make")
    .order("model")
    .order("year");
  if (error) throw error;
  return (data ?? []) as AssignableVehicle[];
}

export async function listLinkableAgreements(): Promise<LinkableAgreement[]> {
  const { data, error } = await supabase
    .from("agreements")
    .select("id,agreement_number,status,created_at,consigner_id,template:agreement_templates(name)")
    .neq("status", "voided")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LinkableAgreement[];
}

export type AssignVehicleInput = {
  userId: string;
  vehicleId: string;
  ownerPercent: number;
  effectiveFrom: string;
  legalName: string;
  phone?: string;
  agreementId?: string;
};

export async function assignVehicle(input: AssignVehicleInput): Promise<string> {
  const { data, error } = await supabase.rpc("admin_assign_vehicle", {
    p_user_id: input.userId,
    p_vehicle_id: input.vehicleId,
    p_owner_percent: input.ownerPercent,
    p_effective_from: input.effectiveFrom,
    p_legal_name: input.legalName,
    p_phone: input.phone || undefined,
    p_agreement_id: input.agreementId || undefined,
  });
  if (error) throw error;
  return data;
}

/** Sets the last day the owner's share applies. Past or same-day ends are marked ended. */
export async function endAssignment(id: string, lastDay: string, today: string): Promise<void> {
  const { error } = await supabase
    .from("consignments")
    .update({ effective_to: lastDay, status: lastDay <= today ? "ended" : "active" })
    .eq("id", id);
  if (error) throw error;
}

/** Grants or removes the consigner role. Assignment history is kept either way. */
export async function setDashboardAccess(userId: string, enabled: boolean): Promise<void> {
  if (enabled) {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "consigner" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "consigner");
  if (error) throw error;
}
