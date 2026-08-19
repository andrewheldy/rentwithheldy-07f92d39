import { sendAgreementCompleted } from "./email.js";
import { generateExecutedAgreementPdf } from "./pdf.js";
import {
  loadAgreementDetail,
  makeSigningToken,
  recordAgreementEvent,
  signerUrl,
  type ServerSupabase,
} from "./server.js";

export async function finalizeExecutedAgreement(
  supabase: ServerSupabase,
  agreementId: string,
) {
  let detail = await loadAgreementDetail(supabase, agreementId);
  if (detail.status !== "executed") return detail;

  if (!detail.finalPdfPath) {
    const bytes = await generateExecutedAgreementPdf(supabase, detail);
    const year = new Date(detail.executedAt ?? Date.now()).getUTCFullYear();
    const path = `${year}/${detail.agreementNumber}/executed-v${detail.version.number}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("agreements")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw new Error(`Executed PDF upload failed: ${uploadError.message}`);
    const { error: updateError } = await supabase
      .from("agreements")
      .update({ final_pdf_path: path })
      .eq("id", detail.id)
      .is("final_pdf_path", null);
    if (updateError) throw new Error(updateError.message);
    await recordAgreementEvent(supabase, {
      agreementId: detail.id,
      versionId: detail.version.id,
      eventType: "executed_pdf_generated",
      actorType: "system",
      message: "Permanent executed PDF generated and stored privately",
      metadata: { path, document_hash: detail.version.documentHash },
    });
    detail = await loadAgreementDetail(supabase, agreementId);
  }

  const { data: agreementRow } = await supabase
    .from("agreements")
    .select("completion_email_sent_at")
    .eq("id", agreementId)
    .single();
  if (!agreementRow?.completion_email_sent_at) {
    let allSent = true;
    for (const signer of detail.signers) {
      const { token, tokenHash } = makeSigningToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error: tokenError } = await supabase.from("agreement_signing_tokens").insert({
        agreement_id: detail.id,
        agreement_version_id: detail.version.id,
        signer_id: signer.id,
        token_hash: tokenHash,
        purpose: "download",
        expires_at: expiresAt,
      });
      if (tokenError) {
        allSent = false;
        await recordAgreementEvent(supabase, {
          agreementId: detail.id,
          versionId: detail.version.id,
          signerId: signer.id,
          eventType: "completion_email_failed",
          actorType: "system",
          message: `Completion email token could not be created for ${signer.fullName}`,
          metadata: { error: tokenError.message },
        });
        continue;
      }
      try {
        await sendAgreementCompleted({
          agreement: detail,
          signerName: signer.fullName,
          signerEmail: signer.email,
          downloadUrl: signerUrl(token),
        });
        await recordAgreementEvent(supabase, {
          agreementId: detail.id,
          versionId: detail.version.id,
          signerId: signer.id,
          eventType: "completion_email_sent",
          actorType: "system",
          message: `Executed agreement emailed to ${signer.fullName}`,
        });
      } catch (error) {
        allSent = false;
        await recordAgreementEvent(supabase, {
          agreementId: detail.id,
          versionId: detail.version.id,
          signerId: signer.id,
          eventType: "completion_email_failed",
          actorType: "system",
          message: `Completion email failed for ${signer.fullName}`,
          metadata: { error: (error as Error).message },
        });
      }
    }
    if (allSent) {
      await supabase
        .from("agreements")
        .update({ completion_email_sent_at: new Date().toISOString() })
        .eq("id", detail.id)
        .is("completion_email_sent_at", null);
    }
  }
  return loadAgreementDetail(supabase, agreementId);
}
