import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignatureSubmissionSchema } from "../src/lib/agreements/schema.js";
import { finalizeExecutedAgreement } from "../src/server/agreements/finalize.js";
import {
  clientIp,
  configurePrivateResponse,
  createServerSupabase,
  hashSigningToken,
  loadAgreementDetail,
  recordAgreementEvent,
} from "../src/server/agreements/server.js";

async function loadSigningContext(
  supabase: ReturnType<typeof createServerSupabase>,
  rawToken: string,
) {
  const tokenHash = hashSigningToken(rawToken);
  const { data: token, error: tokenError } = await supabase
    .from("agreement_signing_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (tokenError || !token) return { state: "invalid" as const, tokenHash };

  const [{ data: signer }, { data: agreement }, { data: version }] = await Promise.all([
    supabase.from("agreement_signers").select("*").eq("id", token.signer_id).single(),
    supabase.from("agreements").select("*").eq("id", token.agreement_id).single(),
    supabase.from("agreement_versions").select("*").eq("id", token.agreement_version_id).single(),
  ]);
  if (!signer || !agreement || !version) return { state: "invalid" as const, tokenHash };

  if (agreement.status === "voided") return { state: "voided" as const, tokenHash, token, signer, agreement, version };
  if (agreement.current_version_id !== version.id || version.invalidated_at) {
    return { state: "updated" as const, tokenHash, token, signer, agreement, version };
  }
  if (new Date(token.expires_at).getTime() <= Date.now()) {
    return { state: "expired" as const, tokenHash, token, signer, agreement, version };
  }
  if (token.revoked_at && signer.status !== "signed") {
    return { state: "invalid" as const, tokenHash, token, signer, agreement, version };
  }
  if (token.purpose === "download") {
    return {
      state: agreement.status === "executed" ? ("executed" as const) : ("invalid" as const),
      tokenHash,
      token,
      signer,
      agreement,
      version,
    };
  }
  if (signer.status === "signed") {
    return {
      state: agreement.status === "executed" ? ("executed" as const) : ("already_signed" as const),
      tokenHash,
      token,
      signer,
      agreement,
      version,
    };
  }
  if (!["sent", "partially_signed"].includes(agreement.status) || !version.frozen_at) {
    return { state: "invalid" as const, tokenHash, token, signer, agreement, version };
  }
  return { state: "signable" as const, tokenHash, token, signer, agreement, version };
}

function publicPayload(detail: Awaited<ReturnType<typeof loadAgreementDetail>>, state: string, signerId: string) {
  const signer = detail.signers.find((candidate) => candidate.id === signerId);
  if (!signer) throw new Error("Signer not found.");
  return {
    state,
    agreement: {
      agreementNumber: detail.agreementNumber,
      title: detail.templateName,
      version: detail.version.number,
      status: detail.status,
      documentHash: detail.version.documentHash,
      document: detail.version.renderedContent,
      executedAt: detail.executedAt,
      downloadAvailable: detail.status === "executed" && Boolean(detail.finalPdfPath),
    },
    signer: {
      id: signer.id,
      name: signer.fullName,
      role: signer.role,
      status: signer.status,
      signedAt: signer.signedAt,
    },
    signatures: detail.signers.map((party) => ({
      id: party.id,
      name: party.fullName,
      role: party.role,
      required: party.required,
      status: party.status,
      signedAt: party.signedAt,
      signatureMethod: party.signatureMethod,
      typedSignature: party.signatureMethod === "typed" ? party.typedSignature : null,
    })),
  };
}

function rpcErrorStatus(message: string) {
  if (message.includes("expired_signing_token")) return { status: 410, error: "This signing link has expired." };
  if (message.includes("agreement_voided")) return { status: 409, error: "This agreement is no longer active." };
  if (message.includes("already_signed")) return { status: 409, error: "You have already signed this agreement." };
  if (message.includes("typed_signature_must_match")) return { status: 400, error: "Your typed signature must match your signer name." };
  if (message.includes("agreement_not_signable")) return { status: 409, error: "This agreement can no longer be signed from this link." };
  return { status: 400, error: "This signing request could not be completed." };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  configurePrivateResponse(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (Number(req.headers["content-length"] ?? 0) > 800_000) {
    return res.status(413).json({ error: "Signature submission is too large." });
  }

  let supabase: ReturnType<typeof createServerSupabase>;
  try {
    supabase = createServerSupabase();
  } catch (error) {
    return res.status(503).json({ error: (error as Error).message });
  }

  const action = req.body?.action;
  const rawToken = req.body?.token;
  if (typeof rawToken !== "string" || rawToken.length < 40 || rawToken.length > 500) {
    return res.status(400).json({ error: "This signing link is invalid or no longer available." });
  }

  try {
    const context = await loadSigningContext(supabase, rawToken);
    if (!("token" in context) || !("signer" in context) || !("agreement" in context)) {
      return res.status(404).json({ state: context.state, error: "This signing link is invalid or no longer available." });
    }

    if (action === "view") {
      if (!["signable", "already_signed", "executed"].includes(context.state)) {
        return res.status(200).json({ state: context.state });
      }
      const detail = await loadAgreementDetail(supabase, context.agreement.id);
      if (context.state === "signable" && !context.signer.viewed_at) {
        const now = new Date().toISOString();
        await supabase.from("agreement_signers").update({ viewed_at: now }).eq("id", context.signer.id).is("viewed_at", null);
        await supabase.from("agreement_signing_tokens").update({ last_used_at: now }).eq("id", context.token.id);
        await recordAgreementEvent(supabase, {
          agreementId: detail.id,
          versionId: detail.version.id,
          signerId: context.signer.id,
          eventType: "agreement_viewed",
          actorType: "signer",
          message: `${context.signer.signer_name} viewed the agreement`,
        });
      }
      return res.status(200).json(publicPayload(detail, context.state, context.signer.id));
    }

    if (action === "sign") {
      const parsed = SignatureSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Review your signature and consent.", fields: parsed.error.flatten().fieldErrors });
      }
      if (context.state !== "signable") {
        return res.status(409).json({ state: context.state, error: "This agreement cannot be signed from this link." });
      }
      if (parsed.data.confirmedName.toLocaleLowerCase() !== context.signer.signer_name.trim().toLocaleLowerCase()) {
        return res.status(400).json({ error: "Enter the signer name exactly as shown on the agreement." });
      }

      let signaturePath: string | null = null;
      if (parsed.data.method === "drawn") {
        const encoded = parsed.data.signatureDataUrl!.slice("data:image/png;base64,".length);
        const bytes = Buffer.from(encoded, "base64");
        const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const width = bytes.length >= 24 ? bytes.readUInt32BE(16) : 0;
        const height = bytes.length >= 24 ? bytes.readUInt32BE(20) : 0;
        if (
          bytes.length < 100
          || bytes.length > 500_000
          || !bytes.subarray(0, 8).equals(pngHeader)
          || width < 1
          || height < 1
          || width > 4_096
          || height > 4_096
          || width * height > 4_000_000
        ) {
          return res.status(400).json({ error: "The drawn signature image is invalid." });
        }
        const year = new Date().getUTCFullYear();
        signaturePath = `${year}/${context.agreement.agreement_number}/signatures/v${context.version.version_number}/${context.signer.id}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("agreements")
          .upload(signaturePath, bytes, { contentType: "image/png", upsert: false });
        if (uploadError) throw new Error(`Signature storage failed: ${uploadError.message}`);
      }

      const { data: result, error: signatureError } = await supabase.rpc("complete_agreement_signature", {
        p_token_hash: context.tokenHash,
        p_signature_method: parsed.data.method,
        p_signature_artifact_path: signaturePath,
        p_typed_signature: parsed.data.typedSignature ?? null,
        p_consent_version: parsed.data.consentVersion,
        p_ip_address: clientIp(req),
        p_user_agent: String(req.headers["user-agent"] ?? "").slice(0, 1000),
      });
      if (signatureError) {
        if (signaturePath) await supabase.storage.from("agreements").remove([signaturePath]);
        const mapped = rpcErrorStatus(signatureError.message);
        return res.status(mapped.status).json({ error: mapped.error });
      }

      const nextStatus = result?.[0]?.agreement_status;
      let pdfPending = false;
      if (nextStatus === "executed") {
        try {
          await finalizeExecutedAgreement(supabase, context.agreement.id);
        } catch (error) {
          pdfPending = true;
          console.error("Agreement execution finalization failed", context.agreement.id, error);
          await recordAgreementEvent(supabase, {
            agreementId: context.agreement.id,
            versionId: context.version.id,
            eventType: "execution_finalization_failed",
            actorType: "system",
            message: "Agreement was executed, but PDF or completion email finalization needs retry",
            metadata: { error: (error as Error).message },
          });
        }
      }
      const detail = await loadAgreementDetail(supabase, context.agreement.id);
      return res.status(200).json({ ...publicPayload(detail, detail.status === "executed" ? "executed" : "already_signed", context.signer.id), pdfPending });
    }

    if (action === "download") {
      if (
        context.state !== "executed"
        || (context.token.purpose !== "download" && context.signer.status !== "signed")
      ) {
        return res.status(409).json({ error: "The executed agreement is not available from this link." });
      }
      const detail = await finalizeExecutedAgreement(supabase, context.agreement.id);
      if (!detail.finalPdfPath) throw new Error("The executed PDF is not available yet.");
      const { data, error } = await supabase.storage
        .from("agreements")
        .createSignedUrl(detail.finalPdfPath, 900, { download: `${detail.agreementNumber}.pdf` });
      if (error || !data) throw new Error(error?.message ?? "Download link could not be created.");
      return res.status(200).json({ url: data.signedUrl });
    }

    return res.status(400).json({ error: "Unsupported signing action." });
  } catch (error) {
    console.error("Public signing operation failed", action, error);
    return res.status(500).json({ error: "The signing service is temporarily unavailable." });
  }
}
