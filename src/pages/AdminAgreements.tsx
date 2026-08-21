import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { AgreementStatusBadge } from "@/components/agreements/AgreementStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SEO from "@/components/SEO";
import { getAgreements } from "@/lib/agreements/api";
import { isLongTermRentalData, type AgreementData, type AgreementListItem, type AgreementStatus } from "@/lib/agreements/types";
import { FileSignature, Plus, Search } from "lucide-react";

const statusOptions: Array<{ value: "all" | AgreementStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Awaiting signatures" },
  { value: "partially_signed", label: "Partially signed" },
  { value: "executed", label: "Executed" },
  { value: "voided", label: "Voided" },
  { value: "expired", label: "Expired" },
];

const agreementVehicles = (data: AgreementData | undefined) => {
  if (!data) return [];
  return isLongTermRentalData(data) ? [data.vehicle] : data.vehicles;
};

export default function AdminAgreements() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AgreementStatus>("all");
  const [agreementType, setAgreementType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["agreements"], queryFn: getAgreements });
  const agreements = useMemo(() => (data?.agreements ?? []) as AgreementListItem[], [data]);
  const agreementTypes = useMemo(
    () => [...new Set(agreements.map((agreement) => agreement.template?.name).filter(Boolean) as string[])].sort(),
    [agreements],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return agreements.filter((agreement) => {
      if (status !== "all" && agreement.status !== status) return false;
      if (agreementType !== "all" && agreement.template?.name !== agreementType) return false;
      if (dateFrom && agreement.created_at.slice(0, 10) < dateFrom) return false;
      if (dateTo && agreement.created_at.slice(0, 10) > dateTo) return false;
      if (!needle) return true;
      const document = agreement.version?.agreement_data;
      return [
        agreement.agreement_number,
        agreement.template?.name,
        ...agreement.signers.flatMap((signer) => [signer.fullName, signer.role]),
        ...agreementVehicles(document).flatMap((vehicle) => [vehicle.vin, vehicle.make, vehicle.model, `${vehicle.year}`]),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [agreementType, agreements, dateFrom, dateTo, query, status]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Agreements · Rent With Heldy Admin" description="Internal agreement management." path="/admin/agreements" noIndex />
      <AdminSectionHeader title="Agreements" />
      <main className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Document operations</p><h2 className="mt-1 text-3xl font-semibold">Agreements</h2><p className="mt-2 text-muted-foreground">Create, send, track, and download executed agreements.</p></div>
          <Button asChild size="lg"><Link to="/admin/agreements/new"><Plus className="me-2 h-4 w-4" /> New Agreement</Link></Button>
        </div>

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-1.5 md:col-span-2"><Label htmlFor="agreement-search">Search</Label><div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="agreement-search" className="ps-9" placeholder="Agreement, signer, VIN, or vehicle" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
            <div className="space-y-1.5"><Label htmlFor="agreement-status">Status</Label><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger id="agreement-status"><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="agreement-type">Agreement type</Label><Select value={agreementType} onValueChange={setAgreementType}><SelectTrigger id="agreement-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All agreement types</SelectItem>{agreementTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="agreement-date-from">Created from</Label><Input id="agreement-date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="agreement-date-to">Created through</Label><Input id="agreement-date-to" type="date" min={dateFrom || undefined} value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></div>
          </div>
        </Card>

        {isLoading ? <Card className="p-10 text-center text-muted-foreground">Loading agreements…</Card> : error ? <Card className="border-destructive p-6 text-destructive">{(error as Error).message}</Card> : filtered.length === 0 ? (
          <Card className="p-10 text-center"><FileSignature className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No agreements found</h3><p className="mt-1 text-sm text-muted-foreground">Create an agreement or adjust the current filters.</p></Card>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
              <Table><TableHeader><TableRow><TableHead>Agreement ID</TableHead><TableHead>Type</TableHead><TableHead>Parties</TableHead><TableHead>Vehicles / Subject</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Sent</TableHead><TableHead>Last activity</TableHead><TableHead className="text-end">Actions</TableHead></TableRow></TableHeader><TableBody>
                {filtered.map((agreement) => <TableRow key={agreement.id}><TableCell className="font-semibold">{agreement.agreement_number}</TableCell><TableCell className="max-w-48">{agreement.template?.name ?? "Agreement"}</TableCell><TableCell>{agreement.signers.map((signer) => signer.fullName).join(", ")}</TableCell><TableCell>{agreementVehicles(agreement.version?.agreement_data).map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`).join(", ")}</TableCell><TableCell><AgreementStatusBadge status={agreement.status} /></TableCell><TableCell>{new Date(agreement.created_at).toLocaleDateString()}</TableCell><TableCell>{agreement.sent_at ? new Date(agreement.sent_at).toLocaleDateString() : "—"}</TableCell><TableCell>{new Date(agreement.updated_at).toLocaleString()}</TableCell><TableCell className="text-end"><Button asChild variant="outline" size="sm"><Link to={`/admin/agreements/${agreement.id}`}>View</Link></Button></TableCell></TableRow>)}
              </TableBody></Table>
            </div>
            <div className="grid gap-3 md:hidden">
              {filtered.map((agreement) => <Card key={agreement.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{agreement.agreement_number}</p><p className="mt-1 text-sm text-muted-foreground">{agreement.template?.name}</p></div><AgreementStatusBadge status={agreement.status} /></div><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-muted-foreground">Parties</dt><dd className="font-medium">{agreement.signers.map((signer) => signer.fullName).join(", ")}</dd></div><div><dt className="text-muted-foreground">Vehicles</dt><dd className="font-medium">{agreementVehicles(agreement.version?.agreement_data).map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`).join(", ")}</dd></div></dl><Button asChild variant="outline" className="mt-4 w-full"><Link to={`/admin/agreements/${agreement.id}`}>View agreement</Link></Button></Card>)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
