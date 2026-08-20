import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { parseAgreementData } from "../src/lib/agreements/schema.js";
import { canonicalize, resolveAgreementDocument } from "../src/lib/agreements/render.js";
import { sendAgreementInvitation } from "../src/server/agreements/email.js";
import { finalizeExecutedAgreement } from "../src/server/agreements/finalize.js";
import {
  configurePrivateResponse,
  createServerSupabase,
  loadAgreementDetail,
  makeSigningToken,
  recordAgreementEvent,
  requireAdmin,
  signerForDocument,
  signerUrl,
} from "../src/server/agreements/server.js";

const TOKEN_DAYS = 30;
const REMINDER_COOLDOWN_MS = 15 * 60 * 1000;

function tokenExpiry() {
  return new Date(Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  configurePrivateResponse(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let supabase: ReturnType<typeof createServerSupabase>;
  try {
    supabase = createServerSupabase();
  } catch (error) {
    return res.status(503).json({ error: (error as Error).message });
  }
  const admin = await requireAdmin(req, res, supabase);
  if (!admin) return;

  const action = req.body?.action;
  const agreementId = req.body?.agreementId;
  if (typeof agreementId !== "string") return res.status(400).json({ error: "Agreement ID is required." });

  try {
    let detail = await loadAgreementDetail(supabase, agreementId);

    if (action === "send") {
      if (detail.status !== "draft" || detail.version.frozenAt) {
        return res.status(409).json({ error: "Only an unfrozen draft can be sent." });
      }
      const parsed = parseAgreementData(detail.templateDefinition, detail.version.agreementData, true);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Complete all required agreement fields before sending.",
          fields: parsed.error.flatten().fieldErrors,
        });
      }
      const agreementData = parsed.data;
      const document = resolveAgreementDocument(
        detail.templateName,
        detail.templateDefinition,
        detail.agreementNumber,
        detail.version.number,
        agreementData,
        detail.signers.map(signerForDocument),
      );
      const documentHash = createHash("sha256").update(canonicalize(document)).digest("hex");
      const links: Array<{ signerId: string; signerName: string; url: string }> = [];
      const tokens = detail.signers.map((signer) => {
        const generated = makeSigningToken();
        links.push({ signerId: signer.id, signerName: signer.fullName, url: signerUrl(generated.token) });
        return { signer_id: signer.id, token_hash: generated.tokenHash, expires_at: tokenExpiry() };
      });
      const { error: sendError } = await supabase.rpc("send_agreement_version", {
        p_agreement_id: detail.id,
        p_rendered_content: document,
        p_document_hash: documentHash,
        p_tokens: tokens,
        p_sent_by: admin.id,
      });
      if (sendError) throw new Error(sendError.message);
      detail = await loadAgreementDetail(supabase, detail.id);

      const customMessage = typeof req.body?.message === "string" ? req.body.message.slice(0, 1000) : undefined;
      const emailResults = await Promise.allSettled(
        detail.signers.map(async (signer) => {
          const link = links.find((item) => item.signerId === signer.id);
          if (!link) throw new Error("Signer link missing.");
          await sendAgreementInvitation({
            agreement: detail,
            signerName: signer.fullName,
            signerEmail: signer.email,
            signingUrl: link.url,
            customMessage,
          });
          await supabase
            .from("agreement_signers")
            .update({ invite_sent_at: new Date().toISOString() })
            .eq("id", signer.id);
          await recordAgreementEvent(supabase, {
            agreementId: detail.id,
            versionId: detail.version.id,
            signerId: signer.id,
            eventType: "invitation_sent",
            actorType: "admin",
            actorUserId: admin.id,
            message: `Signing invitation sent to ${signer.fullName}`,
          });
        }),
      );
      const failed = emailResults.filter((result) => result.status === "rejected").length;
      if (failed) {
        await recordAgreementEvent(supabase, {
          agreementId: detail.id,
          versionId: detail.version.id,
          eventType: "invitation_delivery_partial_failure",
          actorType: "system",
          message: `${failed} signing invitation${failed === 1 ? "" : "s"} failed to send`,
        });
      }
      return res.status(200).json({ agreement: await loadAgreementDetail(supabase, detail.id), signingLinks: links, failedEmails: failed });
    }

    if (action === "create_revision") {
      if (!["sent", "partially_signed"].includes(detail.status)) {
        return res.status(409).json({ error: "Only an active agreement can be revised." });
      }
      const { error } = await supabase.rpc("revise_agreement_version", {
        p_agreement_id: detail.id,
        p_created_by: admin.id,
      });
      if (error) throw new Error(error.message);
      return res.status(200).json({ agreement: await loadAgreementDetail(supabase, detail.id) });
    }

    if (action === "create_link") {
      const signer = detail.signers.find((candidate) => candidate.id === req.body?.signerId);
      if (!signer) return res.status(404).json({ error: "Signer not found." });
      if (!["sent", "partially_signed", "executed"].includes(detail.status)) {
        return res.status(409).json({ error: "Signing links are available only after sending." });
      }
      if (signer.status === "signed" && detail.status !== "executed") {
        return res.status(409).json({ error: "This signer has already signed." });
      }
      const generated = makeSigningToken();
      const { error } = await supabase.from("agreement_signing_tokens").insert({
        agreement_id: detail.id,
        agreement_version_id: detail.version.id,
        signer_id: signer.id,
        token_hash: generated.tokenHash,
        purpose: detail.status === "executed" ? "download" : "signing",
        expires_at: tokenExpiry(),
      });
      if (error) throw new Error(error.message);
      await recordAgreementEvent(supabase, {
        agreementId: detail.id,
        versionId: detail.version.id,
        signerId: signer.id,
        eventType: "signing_link_created",
        actorType: "admin",
        actorUserId: admin.id,
        message: `A fresh secure link was created for ${signer.fullName}`,
      });
      return res.status(200).json({ url: signerUrl(generated.token) });
    }

    if (action === "remind") {
      const signer = detail.signers.find((candidate) => candidate.id === req.body?.signerId);
      if (!signer) return res.status(404).json({ error: "Signer not found." });
      if (signer.status !== "pending" || !["sent", "partially_signed"].includes(detail.status)) {
        return res.status(409).json({ error: "Only pending signers can receive reminders." });
      }
      const { data: signerRow } = await supabase
        .from("agreement_signers")
        .select("last_reminder_at,reminder_count")
        .eq("id", signer.id)
        .single();
      if (signerRow?.last_reminder_at && Date.now() - new Date(signerRow.last_reminder_at).getTime() < REMINDER_COOLDOWN_MS) {
        return res.status(429).json({ error: "A reminder was sent recently. Wait 15 minutes before sending another." });
      }
      const generated = makeSigningToken();
      const { error: tokenError } = await supabase.from("agreement_signing_tokens").insert({
        agreement_id: detail.id,
        agreement_version_id: detail.version.id,
        signer_id: signer.id,
        token_hash: generated.tokenHash,
        expires_at: tokenExpiry(),
      });
      if (tokenError) throw new Error(tokenError.message);
      await sendAgreementInvitation({
        agreement: detail,
        signerName: signer.fullName,
        signerEmail: signer.email,
        signingUrl: signerUrl(generated.token),
        customMessage: typeof req.body?.message === "string" ? req.body.message.slice(0, 1000) : undefined,
        reminder: true,
      });
      await supabase
        .from("agreement_signers")
        .update({
          last_reminder_at: new Date().toISOString(),
          reminder_count: (signerRow?.reminder_count ?? 0) + 1,
        })
        .eq("id", signer.id);
      await recordAgreementEvent(supabase, {
        agreementId: detail.id,
        versionId: detail.version.id,
        signerId: signer.id,
        eventType: "reminder_sent",
        actorType: "admin",
        actorUserId: admin.id,
        message: `Signing reminder sent to ${signer.fullName}`,
      });
      return res.status(200).json({ ok: true });
    }

    if (action === "void") {
      if (!["sent", "partially_signed"].includes(detail.status)) {
        return res.status(409).json({ error: "Only an active agreement can be voided." });
      }
      const now = new Date().toISOString();
      const { error: voidError } = await supabase
        .from("agreements")
        .update({ status: "voided", voided_at: now })
        .eq("id", detail.id)
        .in("status", ["sent", "partially_signed"]);
      if (voidError) throw new Error(voidError.message);
      await supabase
        .from("agreement_signing_tokens")
        .update({ revoked_at: now })
        .eq("agreement_id", detail.id)
        .is("revoked_at", null);
      await recordAgreementEvent(supabase, {
        agreementId: detail.id,
        versionId: detail.version.id,
        eventType: "agreement_voided",
        actorType: "admin",
        actorUserId: admin.id,
        message: typeof req.body?.reason === "string" ? req.body.reason.slice(0, 500) : "Agreement voided by administrator",
      });
      return res.status(200).json({ agreement: await loadAgreementDetail(supabase, detail.id) });
    }

    if (action === "download") {
      if (detail.status !== "executed") return res.status(409).json({ error: "The agreement is not executed." });
      detail = await finalizeExecutedAgreement(supabase, detail.id);
      if (!detail.finalPdfPath) throw new Error("Executed PDF is not available.");
      const { data, error } = await supabase.storage.from("agreements").createSignedUrl(detail.finalPdfPath, 900, { download: `${detail.agreementNumber}.pdf` });
      if (error || !data) throw new Error(error?.message ?? "Download link could not be created.");
      return res.status(200).json({ url: data.signedUrl });
    }

    if (action === "retry_execution") {
      if (detail.status !== "executed") return res.status(409).json({ error: "The agreement is not executed." });
      detail = await finalizeExecutedAgreement(supabase, detail.id);
      return res.status(200).json({ agreement: detail });
    }

    return res.status(400).json({ error: "Unsupported agreement action." });
  } catch (error) {
    console.error("Agreement action failed", action, error);
    return res.status(500).json({ error: (error as Error).message || "Agreement action failed." });
  }
}
