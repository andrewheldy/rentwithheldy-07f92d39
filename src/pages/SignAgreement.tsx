import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "@/assets/rent-with-heldy-logo.png";
import { AgreementDocument } from "@/components/agreements/AgreementDocument";
import { SignaturePad } from "@/components/agreements/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AGREEMENT_CONSENT_VERSION, type ResolvedAgreementDocument } from "@/lib/agreements/types";
import { signingAction } from "@/lib/agreements/api";
import { AlertCircle, CheckCircle2, Download, FileCheck2, Loader2, PenLine } from "lucide-react";

type SigningPayload = {
  state: "signable" | "already_signed" | "executed" | "voided" | "expired" | "updated" | "invalid";
  agreement: {
    agreementNumber: string;
    title: string;
    version: number;
    status: string;
    documentHash: string;
    document: ResolvedAgreementDocument;
    executedAt: string | null;
    downloadAvailable: boolean;
  };
  signer: { id: string; name: string; role: string; status: string; signedAt: string | null };
  signatures: Array<{ id: string; name: string; role: string; status: "pending" | "signed" | "declined"; signedAt: string | null; signatureMethod?: "drawn" | "typed" | null; typedSignature?: string | null }>;
  pdfPending?: boolean;
};

const stateCopy: Record<string, { title: string; body: string }> = {
  invalid: { title: "Invalid link", body: "This signing link is invalid or no longer available." },
  expired: { title: "Signing link expired", body: "This signing link has expired. Please contact Rent With Heldy for a new link." },
  voided: { title: "Agreement voided", body: "This agreement is no longer active." },
  updated: { title: "Agreement updated", body: "This agreement has been updated. Please use the latest signing invitation." },
};

export default function SignAgreement() {
  const { token: pathToken = "" } = useParams();
  let fragmentToken = "";
  try { fragmentToken = decodeURIComponent(window.location.hash.replace(/^#/, "")); } catch { fragmentToken = ""; }
  const token = pathToken || fragmentToken;
  const [payload, setPayload] = useState<SigningPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [method, setMethod] = useState<"drawn" | "typed">("drawn");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [confirmedName, setConfirmedName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    signingAction({ action: "view", token })
      .then((next) => { if (active) setPayload(next); })
      .catch((error) => { if (active) setLoadError((error as Error).message); });
    return () => { active = false; };
  }, [token]);

  const sign = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!payload) return;
    if (confirmedName.trim().toLocaleLowerCase() !== payload.signer.name.trim().toLocaleLowerCase()) {
      setFormError("Enter your name exactly as shown above.");
      return;
    }
    if (!consent) { setFormError("Electronic-signature consent is required."); return; }
    if (method === "drawn" && !signatureDataUrl) { setFormError("Draw your signature before signing."); return; }
    if (method === "typed" && typedSignature.trim().toLocaleLowerCase() !== payload.signer.name.trim().toLocaleLowerCase()) { setFormError("Your typed signature must match your signer name."); return; }
    setSubmitting(true);
    try {
      const next = await signingAction({
        action: "sign",
        token,
        confirmedName,
        consent: true,
        consentVersion: AGREEMENT_CONSENT_VERSION,
        method,
        signatureDataUrl: method === "drawn" ? signatureDataUrl : undefined,
        typedSignature: method === "typed" ? typedSignature : undefined,
      });
      setPayload(next);
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (error) { setFormError((error as Error).message); }
    finally { setSubmitting(false); }
  };

  const download = async () => {
    setDownloading(true);
    try { const result = await signingAction({ action: "download", token }); window.location.assign(result.url); }
    catch (error) { setFormError((error as Error).message); }
    finally { setDownloading(false); }
  };

  if (!payload && !loadError) return <Shell><div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading secure agreement…</div></Shell>;
  if (loadError) return <Shell><StateCard title="Signing link unavailable" body={loadError} /></Shell>;
  if (!payload) return null;
  if (stateCopy[payload.state]) return <Shell><StateCard {...stateCopy[payload.state]} /></Shell>;

  const complete = payload.state === "already_signed" || payload.state === "executed";
  return (
    <Shell agreementNumber={payload.agreement.agreementNumber}>
      {complete && (
        <Card className="mb-6 border-emerald-300 bg-emerald-50 p-5 sm:p-6" role="status">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" /><div><h1 className="text-xl font-semibold">{payload.state === "executed" ? "Agreement complete" : "Your signature is complete"}</h1><p className="mt-1 text-sm text-emerald-950">{payload.state === "executed" ? "All required parties have signed this agreement." : "Your signature was recorded. Rent With Heldy will notify you when all required parties have signed."}</p>{payload.pdfPending && <p className="mt-2 text-sm font-medium">The executed PDF is being prepared. Please try the download again shortly.</p>}{payload.state === "executed" && <Button className="mt-4" onClick={download} disabled={downloading}><Download className="me-2 h-4 w-4" /> {downloading ? "Preparing download…" : "Download executed PDF"}</Button>}</div></div>
        </Card>
      )}
      <AgreementDocument document={payload.agreement.document} signatures={payload.signatures} />
      {payload.state === "signable" && (
        <section aria-labelledby="signature-heading" className="mx-auto mt-6 max-w-4xl border-y border-border bg-card px-5 py-8 sm:rounded-xl sm:border sm:px-10 sm:py-10 sm:shadow-sm">
          <div className="flex items-start gap-3"><PenLine className="mt-1 h-6 w-6 text-primary" aria-hidden="true" /><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Your signature</p><h2 id="signature-heading" className="mt-1 text-2xl font-semibold">Sign as {payload.signer.name}</h2><p className="mt-1 text-muted-foreground">{payload.signer.role}</p></div></div>
          <form onSubmit={sign} className="mt-7 space-y-6" noValidate>
            <div className="space-y-1.5"><Label htmlFor="confirm-name">Confirm your full name</Label><Input id="confirm-name" autoComplete="name" value={confirmedName} onChange={(event) => setConfirmedName(event.target.value)} placeholder={payload.signer.name} required aria-describedby="confirm-name-help" /><p id="confirm-name-help" className="text-sm text-muted-foreground">Enter your name exactly as it appears on this agreement.</p></div>
            <Tabs value={method} onValueChange={(value) => setMethod(value as "drawn" | "typed")}>
              <TabsList className="grid h-auto w-full grid-cols-2"><TabsTrigger value="drawn" className="min-h-11">Draw signature</TabsTrigger><TabsTrigger value="typed" className="min-h-11">Type signature</TabsTrigger></TabsList>
              <TabsContent value="drawn" className="mt-4"><SignaturePad onChange={setSignatureDataUrl} /></TabsContent>
              <TabsContent value="typed" className="mt-4 space-y-1.5"><Label htmlFor="typed-signature">Typed electronic signature</Label><Input id="typed-signature" className="h-14 text-xl italic" autoComplete="name" value={typedSignature} onChange={(event) => setTypedSignature(event.target.value)} placeholder={payload.signer.name} /><p className="text-sm text-muted-foreground">Typing your name here creates a typed electronic signature; it is not a handwritten signature.</p></TabsContent>
            </Tabs>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-4"><Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" /><span className="text-sm leading-6"><strong>I have reviewed this Agreement and agree to use my electronic signature to sign it.</strong><br /><span className="text-muted-foreground">By selecting Sign Agreement, I intend to sign this Agreement electronically.</span></span></label>
            {formError && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}</div>}
            <Button type="submit" size="lg" className="min-h-12 w-full sm:w-auto" disabled={submitting}>{submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="me-2 h-4 w-4" />}{submitting ? "Signing agreement…" : "Sign Agreement"}</Button>
          </form>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children, agreementNumber }: { children: React.ReactNode; agreementNumber?: string }) {
  return <div className="min-h-screen bg-background"><Helmet><title>{agreementNumber ? `${agreementNumber} · Review & Sign` : "Review & Sign Agreement"}</title><meta name="robots" content="noindex,nofollow,noarchive" /><meta name="referrer" content="no-referrer" /></Helmet><header className="border-b border-border bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-0"><img src={logo} alt="Rent With Heldy" className="h-10 w-auto" /><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Secure agreement</span></div></header><main className="px-0 py-6 sm:px-4 sm:py-10">{children}</main><footer className="mx-auto max-w-4xl px-5 py-10 text-sm text-muted-foreground sm:px-0"><p>Questions? Call <a className="font-medium text-foreground underline" href="tel:+15615198958">561-519-8958</a> or email <a className="font-medium text-foreground underline" href="mailto:heldy@rentwithheldy.com">heldy@rentwithheldy.com</a>.</p></footer></div>;
}

function StateCard({ title, body }: { title: string; body: string }) {
  return <Card className="mx-auto max-w-xl p-6 sm:p-8"><AlertCircle className="h-7 w-7 text-amber-700" /><h1 className="mt-4 text-2xl font-semibold">{title}</h1><p className="mt-2 leading-7 text-muted-foreground">{body}</p><p className="mt-5 text-sm">Contact Rent With Heldy at <a className="font-semibold underline" href="tel:+15615198958">561-519-8958</a>.</p></Card>;
}
