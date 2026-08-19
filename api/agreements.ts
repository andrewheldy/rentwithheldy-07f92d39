import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  AgreementCreateSchema,
  AgreementUpdateSchema,
} from "../src/lib/agreements/schema.js";
import type {
  AgreementListItem,
  TemplateDefinition,
  VehicleConsignmentAgreementData,
} from "../src/lib/agreements/types.js";
import {
  configurePrivateResponse,
  createServerSupabase,
  loadAgreementDetail,
  recordAgreementEvent,
  requireAdmin,
} from "../src/server/agreements/server.js";

type AgreementRow = {
  id: string;
  agreement_number: string;
  template_id: string;
  current_version_id: string;
  status: AgreementListItem["status"];
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  executed_at: string | null;
};
type TemplateRow = { id: string; name: string };
type VersionRow = { id: string; agreement_data: VehicleConsignmentAgreementData };
type SignerListRow = {
  agreement_id: string;
  agreement_version_id: string;
  signer_name: string;
  signer_role: string;
  status: "pending" | "signed" | "declined";
};

function signerRows(
  agreementId: string,
  versionId: string,
  data: VehicleConsignmentAgreementData,
) {
  return [data.operator.signer, ...data.owners].map((signer, index) => ({
    agreement_id: agreementId,
    agreement_version_id: versionId,
    signer_name: signer.fullName,
    signer_email: signer.email,
    signer_phone: signer.phone || null,
    signer_address: signer.address || null,
    signer_role: signer.role,
    signing_order: index + 1,
    required: signer.required,
  }));
}

async function listAgreements(supabase: ReturnType<typeof createServerSupabase>) {
  const { data: agreements, error } = await supabase
    .from("agreements")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  if (!agreements?.length) return [];

  const agreementRows = agreements as AgreementRow[];
  const templateIds = [...new Set(agreementRows.map((agreement) => agreement.template_id))];
  const versionIds = agreementRows.map((agreement) => agreement.current_version_id).filter(Boolean);
  const agreementIds = agreementRows.map((agreement) => agreement.id);
  const [{ data: templates }, { data: versions }, { data: signers }] = await Promise.all([
    supabase.from("agreement_templates").select("id,name").in("id", templateIds),
    supabase.from("agreement_versions").select("id,agreement_data").in("id", versionIds),
    supabase
      .from("agreement_signers")
      .select("agreement_id,agreement_version_id,signer_name,signer_role,status")
      .in("agreement_id", agreementIds),
  ]);
  const templateById = new Map(((templates ?? []) as TemplateRow[]).map((row) => [row.id, row]));
  const versionById = new Map(((versions ?? []) as VersionRow[]).map((row) => [row.id, row]));
  const signerRows = (signers ?? []) as SignerListRow[];

  return agreementRows.map((agreement): AgreementListItem => ({
    id: agreement.id,
    agreement_number: agreement.agreement_number,
    status: agreement.status,
    created_at: agreement.created_at,
    updated_at: agreement.updated_at,
    sent_at: agreement.sent_at,
    executed_at: agreement.executed_at,
    template: templateById.get(agreement.template_id) ?? null,
    version: versionById.get(agreement.current_version_id) ?? null,
    signers: signerRows
      .filter((signer) => signer.agreement_version_id === agreement.current_version_id)
      .map((signer) => ({
        fullName: signer.signer_name,
        role: signer.signer_role,
        status: signer.status,
      })),
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  configurePrivateResponse(res);
  let supabase: ReturnType<typeof createServerSupabase>;
  try {
    supabase = createServerSupabase();
  } catch (error) {
    return res.status(503).json({ error: (error as Error).message });
  }
  const admin = await requireAdmin(req, res, supabase);
  if (!admin) return;

  try {
    if (req.method === "GET") {
      if (req.query.resource === "templates") {
        const { data, error } = await supabase
          .from("agreement_templates")
          .select("id,template_key,name,version,template_definition")
          .eq("status", "active")
          .order("name");
        if (error) throw new Error(error.message);
        return res.status(200).json({ templates: data ?? [] });
      }
      const id = typeof req.query.id === "string" ? req.query.id : null;
      if (id) return res.status(200).json({ agreement: await loadAgreementDetail(supabase, id) });
      return res.status(200).json({ agreements: await listAgreements(supabase) });
    }

    if (req.method === "POST") {
      const action = req.body?.action;
      if (action === "create") {
        const parsed = AgreementCreateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Review the agreement fields.", fields: parsed.error.flatten().fieldErrors });
        }
        const agreementData = parsed.data.agreementData as VehicleConsignmentAgreementData;
        const { data: template, error: templateError } = await supabase
          .from("agreement_templates")
          .select("id,name,template_definition")
          .eq("id", parsed.data.templateId)
          .eq("status", "active")
          .single();
        if (templateError || !template) return res.status(400).json({ error: "The selected template is unavailable." });
        const definition = template.template_definition as TemplateDefinition;
        const { data: agreementNumber, error: numberError } = await supabase.rpc(
          "generate_agreement_number",
          { template_code: definition.agreement_code },
        );
        if (numberError || !agreementNumber) throw new Error(numberError?.message ?? "Agreement number could not be generated.");

        const { data: agreement, error: agreementError } = await supabase
          .from("agreements")
          .insert({
            agreement_number: agreementNumber,
            template_id: template.id,
            created_by: admin.id,
          })
          .select("id")
          .single();
        if (agreementError || !agreement) throw new Error(agreementError?.message ?? "Agreement could not be created.");

        try {
          const { data: version, error: versionError } = await supabase
            .from("agreement_versions")
            .insert({
              agreement_id: agreement.id,
              template_id: template.id,
              version_number: 1,
              agreement_data: agreementData,
              created_by: admin.id,
            })
            .select("id")
            .single();
          if (versionError || !version) throw new Error(versionError?.message ?? "Agreement version could not be created.");
          const { error: linkError } = await supabase
            .from("agreements")
            .update({ current_version_id: version.id })
            .eq("id", agreement.id);
          if (linkError) throw new Error(linkError.message);
          const { error: signerError } = await supabase
            .from("agreement_signers")
            .insert(signerRows(agreement.id, version.id, agreementData));
          if (signerError) throw new Error(signerError.message);
          await recordAgreementEvent(supabase, {
            agreementId: agreement.id,
            versionId: version.id,
            eventType: "agreement_created",
            actorType: "admin",
            actorUserId: admin.id,
            message: `${agreementNumber} created from ${template.name}`,
            metadata: { version: 1 },
          });
          return res.status(201).json({ agreement: await loadAgreementDetail(supabase, agreement.id) });
        } catch (error) {
          await supabase.from("agreements").delete().eq("id", agreement.id);
          throw error;
        }
      }

      if (action === "update") {
        const parsed = AgreementUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Review the agreement fields.", fields: parsed.error.flatten().fieldErrors });
        }
        const agreementData = parsed.data.agreementData as VehicleConsignmentAgreementData;
        const detail = await loadAgreementDetail(supabase, parsed.data.agreementId);
        if (detail.status !== "draft" || detail.version.frozenAt) {
          return res.status(409).json({ error: "Only an unfrozen draft can be edited." });
        }
        const { error: updateError } = await supabase.rpc("update_agreement_draft", {
          p_agreement_id: detail.id,
          p_agreement_data: agreementData,
          p_signers: signerRows(detail.id, detail.version.id, agreementData),
          p_updated_by: admin.id,
        });
        if (updateError) throw new Error(updateError.message);
        return res.status(200).json({ agreement: await loadAgreementDetail(supabase, detail.id) });
      }
      return res.status(400).json({ error: "Unsupported agreement action." });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Agreements API error", error);
    return res.status(500).json({ error: (error as Error).message || "Agreement operation failed." });
  }
}
