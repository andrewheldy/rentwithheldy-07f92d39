import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { AgreementForm } from "@/components/agreements/AgreementForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEO from "@/components/SEO";
import { getAgreementTemplates, saveAgreement } from "@/lib/agreements/api";
import { DEFAULT_VEHICLE_CONSIGNMENT_DATA, type VehicleConsignmentAgreementData } from "@/lib/agreements/types";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function AdminAgreementNew() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["agreement-templates"], queryFn: getAgreementTemplates });
  const templates = useMemo(() => (data?.templates ?? []) as Array<{ id: string; name: string; version: number }>, [data]);
  const [templateId, setTemplateId] = useState("");
  const [agreementData, setAgreementData] = useState<VehicleConsignmentAgreementData>(() => structuredClone(DEFAULT_VEHICLE_CONSIGNMENT_DATA));
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!templateId && templates[0]?.id) setTemplateId(templates[0].id); }, [templateId, templates]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!templateId) return;
    setSaving(true);
    try {
      const result = await saveAgreement({ action: "create", templateId, agreementData });
      toast({ title: "Draft created", description: result.agreement.agreementNumber });
      navigate(`/admin/agreements/${result.agreement.id}`);
    } catch (error) {
      toast({ title: "Draft could not be created", description: (error as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return <div className="min-h-screen bg-background"><SEO title="New Agreement · Rent With Heldy Admin" description="Create a Rent With Heldy agreement." path="/admin/agreements/new" noIndex /><AdminSectionHeader title="New Agreement" /><main className="container mx-auto px-4 py-6 sm:py-8"><Button variant="ghost" onClick={() => navigate("/admin/agreements")}><ArrowLeft className="me-2 h-4 w-4" /> Agreements</Button><div className="mt-5 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Step 1 of 1</p><h2 className="mt-1 text-3xl font-semibold">Create agreement</h2><p className="mt-2 text-muted-foreground">Choose a versioned template, confirm the parties and terms, then save the draft.</p></div><form onSubmit={submit} className="mt-6 space-y-6"><Card className="p-5 sm:p-6"><div className="max-w-xl space-y-1.5"><Label htmlFor="agreement-template">Agreement type</Label><Select value={templateId} onValueChange={setTemplateId} disabled={isLoading}><SelectTrigger id="agreement-template"><SelectValue placeholder="Choose agreement type" /></SelectTrigger><SelectContent>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name} · v{template.version}</SelectItem>)}</SelectContent></Select><p className="text-sm text-muted-foreground">The selected template version will be frozen with the agreement when sent.</p></div></Card><AgreementForm value={agreementData} onChange={setAgreementData} /><div className="sticky bottom-0 z-10 flex justify-end border-t border-border bg-background/95 px-1 py-4 backdrop-blur"><Button type="submit" size="lg" disabled={saving || !templateId}><Save className="me-2 h-4 w-4" /> {saving ? "Saving draft…" : "Save draft"}</Button></div></form></main></div>;
}
