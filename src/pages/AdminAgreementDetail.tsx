import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { AgreementDocument } from "@/components/agreements/AgreementDocument";
import { AgreementForm } from "@/components/agreements/AgreementForm";
import { AgreementStatusBadge } from "@/components/agreements/AgreementStatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";
import { agreementAction, getAgreement, saveAgreement } from "@/lib/agreements/api";
import { resolveAgreementDocument } from "@/lib/agreements/render";
import { parseAgreementData } from "@/lib/agreements/schema";
import type { AgreementData, AgreementDetail, ResolvedAgreementDocument } from "@/lib/agreements/types";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Ban, Bell, CheckCircle2, Clipboard, Download, Eye, FilePlus2, Mail, Save, Send } from "lucide-react";

const eventLabels: Record<string, string> = {
  agreement_created: "Agreement created",
  agreement_edited: "Draft edited",
  agreement_sent: "Agreement frozen and sent",
  invitation_sent: "Invitation sent",
  agreement_viewed: "Agreement viewed",
  signer_signed: "Signature completed",
  agreement_executed: "Agreement executed",
  executed_pdf_generated: "Executed PDF generated",
  completion_email_sent: "Completion email sent",
  reminder_sent: "Reminder sent",
  signing_link_created: "Secure link created",
  agreement_revision_created: "New agreement version created",
  agreement_voided: "Agreement voided",
};

export default function AdminAgreementDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["agreement", id], queryFn: () => getAgreement(id), enabled: Boolean(id) });
  const detail = data?.agreement as AgreementDetail | undefined;
  const [draft, setDraft] = useState<AgreementData | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("Please review and sign the Rent With Heldy agreement using the secure link below.");
  const [sendOpen, setSendOpen] = useState(false);
  useEffect(() => { if (detail) setDraft(structuredClone(detail.version.agreementData)); }, [detail]);

  const preview = useMemo((): ResolvedAgreementDocument | null => {
    if (!detail || !draft) return null;
    if (detail.version.renderedContent) return detail.version.renderedContent;
    try { return resolveAgreementDocument(detail.templateName, detail.templateDefinition, detail.agreementNumber, detail.version.number, draft, detail.signers); } catch { return null; }
  }, [detail, draft]);
  const sendReady = useMemo(() => Boolean(detail && draft && parseAgreementData(detail.templateDefinition, draft, true).success), [detail, draft]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["agreement", id] }),
      queryClient.invalidateQueries({ queryKey: ["agreements"] }),
    ]);
  };

  const run = async <T,>(name: string, action: () => Promise<T>, success: string): Promise<T | undefined> => {
    setBusy(name);
    try { const result = await action(); toast({ title: success }); await refresh(); return result; }
    catch (operationError) { toast({ title: `${success} failed`, description: (operationError as Error).message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  if (isLoading) return <div className="min-h-screen bg-background"><AdminSectionHeader title="Agreement" /><main className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading agreement…</main></div>;
  if (error || !detail || !draft) return <div className="min-h-screen bg-background"><AdminSectionHeader title="Agreement" /><main className="container mx-auto px-4 py-20"><Card className="border-destructive p-6 text-destructive">{(error as Error)?.message ?? "Agreement not found."}</Card></main></div>;

  const save = () => run("save", () => saveAgreement({ action: "update", agreementId: detail.id, agreementData: draft }), "Draft saved");
  const send = async () => {
    const result = await run("send", () => agreementAction({ action: "send", agreementId: detail.id, message }), "Agreement sent");
    if (result) { setSendOpen(false); if (result.failedEmails) toast({ title: "Some emails need attention", description: `${result.failedEmails} invitation email failed. Secure links remain available.`, variant: "destructive" }); }
  };
  const copyLink = async (signerId: string) => {
    const result = await run(`link-${signerId}`, () => agreementAction({ action: "create_link", agreementId: detail.id, signerId }), "Secure link created");
    if (result?.url) { await navigator.clipboard.writeText(result.url); toast({ title: "Signing link copied" }); }
  };
  const remind = (signerId: string) => run(`remind-${signerId}`, () => agreementAction({ action: "remind", agreementId: detail.id, signerId }), "Reminder sent");
  const download = async () => {
    const result = await run("download", () => agreementAction({ action: "download", agreementId: detail.id }), "Download ready");
    if (result?.url) window.location.assign(result.url);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${detail.agreementNumber} · Agreements`} description="Internal agreement detail." path={`/admin/agreements/${detail.id}`} noIndex />
      <AdminSectionHeader title="Agreement" />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Button variant="ghost" onClick={() => navigate("/admin/agreements")}><ArrowLeft className="me-2 h-4 w-4" /> Agreements</Button>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
          <div><div className="flex flex-wrap items-center gap-3"><h2 className="text-3xl font-semibold">{detail.agreementNumber}</h2><AgreementStatusBadge status={detail.status} /></div><p className="mt-2 text-muted-foreground">{detail.templateName} · Version {detail.version.number}</p><p className="mt-1 text-sm text-muted-foreground">Created {new Date(detail.createdAt).toLocaleString()}</p></div>
          <div className="flex flex-wrap gap-2">
            {detail.status === "draft" && <Button onClick={save} disabled={Boolean(busy)}><Save className="me-2 h-4 w-4" /> {busy === "save" ? "Saving…" : "Save draft"}</Button>}
            {detail.status === "executed" && <Button onClick={download} disabled={Boolean(busy)}><Download className="me-2 h-4 w-4" /> Download PDF</Button>}
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="h-auto flex-wrap"><TabsTrigger value="details">Agreement details</TabsTrigger><TabsTrigger value="preview">Preview agreement</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger></TabsList>
          <TabsContent value="details" className="mt-6 space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-xl font-semibold">Parties and signatures</h3><p className="mt-1 text-sm text-muted-foreground">Required signers can sign in parallel.</p></div>{detail.status === "draft" && (
                <Dialog open={sendOpen} onOpenChange={setSendOpen}><DialogTrigger asChild><Button disabled={!sendReady}><Send className="me-2 h-4 w-4" /> Send for signature</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Send for signature</DialogTitle><DialogDescription>This freezes version {detail.version.number}. Material changes will require a new version and fresh signatures.</DialogDescription></DialogHeader><div><label htmlFor="send-message" className="text-sm font-medium">Optional message</label><Textarea id="send-message" className="mt-2" rows={4} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button><Button onClick={send} disabled={busy === "send"}><Mail className="me-2 h-4 w-4" /> {busy === "send" ? "Sending…" : "Send invitations"}</Button></DialogFooter></DialogContent></Dialog>
              )}</div>
              {!sendReady && detail.status === "draft" && <p className="mt-3 text-sm font-medium text-amber-800">Complete the required agreement fields before sending. You can still save an incomplete draft.</p>}
              <div className="mt-5 divide-y divide-border">
                {detail.signers.map((signer) => <div key={signer.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="font-semibold">{signer.fullName}</p><p className="text-sm text-muted-foreground">{signer.role} · {signer.required ? "Required" : "Optional"}</p><p className="mt-1 flex items-center gap-1.5 text-sm">{signer.status === "signed" ? <><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Signed {signer.signedAt ? new Date(signer.signedAt).toLocaleString() : ""}</> : <Badge variant="outline">Pending</Badge>}</p></div>{signer.status === "pending" && ["sent", "partially_signed"].includes(detail.status) && <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => copyLink(signer.id)} disabled={Boolean(busy)}><Clipboard className="me-2 h-4 w-4" /> Copy link</Button><Button variant="outline" size="sm" onClick={() => remind(signer.id)} disabled={Boolean(busy)}><Bell className="me-2 h-4 w-4" /> Send reminder</Button></div>}</div>)}
              </div>
            </Card>
            <AgreementForm value={draft} onChange={setDraft} disabled={detail.status !== "draft"} />
            {["sent", "partially_signed"].includes(detail.status) && <Card className="p-5"><h3 className="font-semibold">Correct or update this agreement</h3><p className="mt-1 text-sm text-muted-foreground">Create a new draft version for material changes. Existing signatures remain in history, and every old signing link is disabled.</p><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="mt-4"><FilePlus2 className="me-2 h-4 w-4" /> Create revision</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Create a new version of {detail.agreementNumber}?</AlertDialogTitle><AlertDialogDescription>Version {detail.version.number} will be superseded. A new editable draft will be created, and all required parties must sign the replacement version.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current version</AlertDialogCancel><AlertDialogAction onClick={() => run("revision", () => agreementAction({ action: "create_revision", agreementId: detail.id }), "New draft version created")}>Create revision</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></Card>}
            {["sent", "partially_signed"].includes(detail.status) && <Card className="border-rose-200 p-5"><h3 className="font-semibold">Void agreement</h3><p className="mt-1 text-sm text-muted-foreground">Voiding immediately disables pending signing links. This cannot be undone.</p><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="mt-4"><Ban className="me-2 h-4 w-4" /> Void agreement</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Void {detail.agreementNumber}?</AlertDialogTitle><AlertDialogDescription>Pending signers will no longer be able to sign this version.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep agreement</AlertDialogCancel><AlertDialogAction onClick={() => run("void", () => agreementAction({ action: "void", agreementId: detail.id }), "Agreement voided")}>Void agreement</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></Card>}
          </TabsContent>
          <TabsContent value="preview" className="mt-6">{preview ? <><div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><Eye className="h-4 w-4" /> {detail.version.frozenAt ? "Frozen signer view" : "Live HTML draft preview"}</div><AgreementDocument document={preview} signatures={detail.signers.map((signer) => ({ id: signer.id, name: signer.fullName, role: signer.role, status: signer.status ?? "pending", signedAt: signer.signedAt ?? null, signatureMethod: signer.signatureMethod, typedSignature: signer.typedSignature }))} /></> : <Card className="p-8 text-center"><h3 className="font-semibold">Complete the required agreement terms to preview</h3><p className="mt-1 text-sm text-muted-foreground">Return to Agreement details and fill the highlighted required fields.</p></Card>}</TabsContent>
          <TabsContent value="timeline" className="mt-6"><Card className="p-5 sm:p-6"><h3 className="text-xl font-semibold">Agreement history</h3><ol className="mt-6 space-y-0">{detail.events.map((event) => <li key={event.id} className="relative border-s border-border pb-6 ps-6 last:pb-0"><span className="absolute -start-1.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" aria-hidden="true" /><p className="font-semibold">{eventLabels[event.eventType] ?? event.eventType.replace(/_/g, " ")}</p><p className="text-sm text-muted-foreground">{event.message}</p><time className="mt-1 block text-xs text-muted-foreground" dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></li>)}</ol></Card></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
