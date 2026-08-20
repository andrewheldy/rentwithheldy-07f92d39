import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import type {
  AgreementDetail,
  DocumentSigner,
  TemplateDefinition,
  VehicleConsignmentAgreementData,
} from "../../lib/agreements/types.js";

export type ServerSupabase = SupabaseClient;

type AgreementSignerRow = {
  id: string;
  signer_name: string;
  signer_email: string;
  signer_phone: string | null;
  signer_address: string | null;
  signer_role: string;
  required: boolean;
  status: "pending" | "signed" | "declined";
  viewed_at: string | null;
  signed_at: string | null;
  signature_method: "drawn" | "typed" | null;
  signature_artifact_path: string | null;
  typed_signature: string | null;
};

type AgreementEventRow = {
  id: string;
  event_type: string;
  message: string | null;
  created_at: string;
  signer_id: string | null;
};

export function createServerSupabase(): ServerSupabase {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server-only Supabase configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function configurePrivateResponse(res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
  supabase: ServerSupabase,
): Promise<User | null> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  const token = authorization.slice("Bearer ".length);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Your session is invalid or expired." });
    return null;
  }
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !role) {
    res.status(403).json({ error: "Administrator access is required." });
    return null;
  }
  return data.user;
}

export function makeSigningToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSigningToken(token) };
}

export function hashSigningToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getAppBaseUrl() {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return "http://localhost:8080";
}

export function signerUrl(token: string) {
  // Fragments are not sent to the server, keeping signer credentials out of
  // Vercel access logs and referrer headers.
  return `${getAppBaseUrl()}/sign#${encodeURIComponent(token)}`;
}

export function clientIp(req: VercelRequest): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  const candidate = first || req.socket.remoteAddress || null;
  if (!candidate || candidate === "unknown") return null;
  const normalized = candidate.replace(/^::ffff:/, "");
  return isIP(normalized) ? normalized : null;
}

function mapSigner(row: AgreementSignerRow): AgreementDetail["signers"][number] {
  return {
    id: row.id,
    fullName: row.signer_name,
    email: row.signer_email,
    phone: row.signer_phone ?? "",
    address: row.signer_address ?? "",
    role: row.signer_role,
    required: row.required,
    status: row.status,
    viewedAt: row.viewed_at,
    signedAt: row.signed_at,
    signatureMethod: row.signature_method,
    signatureArtifactPath: row.signature_artifact_path,
    typedSignature: row.typed_signature,
  };
}

export async function loadAgreementDetail(
  supabase: ServerSupabase,
  agreementId: string,
): Promise<AgreementDetail> {
  const { data: agreement, error: agreementError } = await supabase
    .from("agreements")
    .select("*")
    .eq("id", agreementId)
    .single();
  if (agreementError || !agreement) throw new Error("Agreement not found.");

  const [{ data: template, error: templateError }, { data: version, error: versionError }] =
    await Promise.all([
      supabase.from("agreement_templates").select("*").eq("id", agreement.template_id).single(),
      supabase.from("agreement_versions").select("*").eq("id", agreement.current_version_id).single(),
    ]);
  if (templateError || !template || versionError || !version) {
    throw new Error("Agreement template or version could not be loaded.");
  }

  const [{ data: signers, error: signerError }, { data: events, error: eventError }] =
    await Promise.all([
      supabase
        .from("agreement_signers")
        .select("*")
        .eq("agreement_version_id", version.id)
        .order("signing_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("agreement_events")
        .select("id,event_type,message,created_at,signer_id")
        .eq("agreement_id", agreement.id)
        .order("created_at", { ascending: false }),
    ]);
  if (signerError || eventError) throw new Error("Agreement history could not be loaded.");

  return {
    id: agreement.id,
    agreementNumber: agreement.agreement_number,
    status: agreement.status,
    templateId: template.id,
    templateName: template.name,
    templateDefinition: template.template_definition as TemplateDefinition,
    createdAt: agreement.created_at,
    updatedAt: agreement.updated_at,
    sentAt: agreement.sent_at,
    executedAt: agreement.executed_at,
    voidedAt: agreement.voided_at,
    expiresAt: agreement.expires_at,
    finalPdfPath: agreement.final_pdf_path,
    version: {
      id: version.id,
      number: version.version_number,
      agreementData: version.agreement_data as VehicleConsignmentAgreementData,
      renderedContent: version.rendered_content,
      documentHash: version.document_hash,
      frozenAt: version.frozen_at,
    },
    signers: ((signers ?? []) as AgreementSignerRow[]).map(mapSigner),
    events: ((events ?? []) as AgreementEventRow[]).map((event) => ({
      id: event.id,
      eventType: event.event_type,
      message: event.message,
      createdAt: event.created_at,
      signerId: event.signer_id,
    })),
  };
}

export function signerForDocument(signer: AgreementDetail["signers"][number]): DocumentSigner {
  return {
    id: signer.id,
    fullName: signer.fullName,
    email: signer.email,
    phone: signer.phone,
    address: signer.address,
    role: signer.role,
    required: signer.required,
    status: signer.status,
    signedAt: signer.signedAt,
    signatureMethod: signer.signatureMethod,
    signatureArtifactPath: signer.signatureArtifactPath,
    typedSignature: signer.typedSignature,
  };
}

export async function recordAgreementEvent(
  supabase: ServerSupabase,
  input: {
    agreementId: string;
    versionId?: string | null;
    signerId?: string | null;
    eventType: string;
    actorUserId?: string | null;
    actorType?: "admin" | "signer" | "system";
    message?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("agreement_events").insert({
    agreement_id: input.agreementId,
    agreement_version_id: input.versionId ?? null,
    signer_id: input.signerId ?? null,
    event_type: input.eventType,
    actor_user_id: input.actorUserId ?? null,
    actor_type: input.actorType ?? "system",
    message: input.message ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw new Error(`Audit event failed: ${error.message}`);
}
