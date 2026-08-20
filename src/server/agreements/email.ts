import { Resend } from "resend";
import type { AgreementDetail } from "../../lib/agreements/types.js";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(apiKey);
}

export async function sendAgreementInvitation(input: {
  agreement: AgreementDetail;
  signerName: string;
  signerEmail: string;
  signingUrl: string;
  customMessage?: string;
  reminder?: boolean;
}) {
  const firstName = input.signerName.trim().split(/\s+/)[0] || input.signerName;
  const subject = input.reminder
    ? `Reminder: Signature requested for ${input.agreement.agreementNumber}`
    : `Signature Requested: Rent With Heldy Vehicle Consignment Agreement`;
  const message =
    input.customMessage?.trim() ||
    "Please review and sign the Rent With Heldy agreement using the secure link below.";
  const safeUrl = escapeHtml(input.signingUrl);
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px;color:#17202a;line-height:1.6">
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>${escapeHtml(message)}</p>
    <p><strong>Agreement</strong><br>${escapeHtml(input.agreement.templateName)}<br>
    <strong>Agreement ID</strong><br>${escapeHtml(input.agreement.agreementNumber)}</p>
    <p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#11a8a8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">Review &amp; Sign Agreement</a></p>
    <p style="font-size:14px;color:#53606d">This link is unique to you. Please do not forward it.</p>
    <hr style="border:0;border-top:1px solid #e4ded1;margin:28px 0">
    <p style="font-size:14px;color:#53606d">Rent With Heldy · 1 South Federal Highway, Dania Beach, Florida 33004 · 561-519-8958 · heldy@rentwithheldy.com</p>
  </div>`;
  const text = `Hi ${firstName},\n\n${message}\n\n${input.agreement.templateName}\nAgreement ID: ${input.agreement.agreementNumber}\n\nReview and sign: ${input.signingUrl}\n\nThis link is unique to you. Please do not forward it.\n\nRent With Heldy\n561-519-8958\nheldy@rentwithheldy.com`;

  const { error } = await resendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: [input.signerEmail],
    subject,
    html,
    text,
  });
  if (error) throw new Error(error.message);
}

export async function sendAgreementCompleted(input: {
  agreement: AgreementDetail;
  signerName: string;
  signerEmail: string;
  downloadUrl: string;
}) {
  const firstName = input.signerName.trim().split(/\s+/)[0] || input.signerName;
  const executed = input.agreement.executedAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(input.agreement.executedAt))
    : "Completed";
  const subject = `Completed: Rent With Heldy Vehicle Consignment Agreement`;
  const safeUrl = escapeHtml(input.downloadUrl);
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px;color:#17202a;line-height:1.6">
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>All required parties have signed the agreement.</p>
    <p><strong>${escapeHtml(input.agreement.templateName)}</strong><br>
    Agreement ID: ${escapeHtml(input.agreement.agreementNumber)}<br>Executed: ${escapeHtml(executed)}</p>
    <p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#11a8a8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">Download Executed Agreement</a></p>
    <p style="font-size:14px;color:#53606d">This secure link is unique to you. Please do not forward it.</p>
  </div>`;
  const text = `Hi ${firstName},\n\nAll required parties have signed ${input.agreement.templateName}.\nAgreement ID: ${input.agreement.agreementNumber}\nExecuted: ${executed}\n\nDownload: ${input.downloadUrl}`;
  const { error } = await resendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: [input.signerEmail],
    subject,
    html,
    text,
  });
  if (error) throw new Error(error.message);
}
