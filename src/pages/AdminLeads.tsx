import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import type { Database } from "@/integrations/supabase/types";

type AcquisitionLead = Database["public"]["Tables"]["acquisition_leads"]["Row"];

type Lead = {
  id: string;
  form_type: string;
  vertical_path: string | null;
  service_context: string | null;
  passenger_type: string | null;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  claim_number: string | null;
  location: string | null;
  needed_when: string | null;
  referred_by: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(","));
  }
  return lines.join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [acquisitionLeads, setAcquisitionLeads] = useState<AcquisitionLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [vertical, setVertical] = useState("all");
  const [formType, setFormType] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [leadsRes, acquisitionRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("acquisition_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (leadsRes.error)
      toast({
        title: "Leads load failed",
        description: leadsRes.error.message,
        variant: "destructive",
      });

      toast({
        title: "Acquisition leads load failed",
        description: acquisitionRes.error.message,
        variant: "destructive",
      });

    setLeads((leadsRes.data as Lead[]) ?? []);
    setAcquisitionLeads((acquisitionRes.data as AcquisitionLead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (vertical !== "all" && l.vertical_path !== vertical) return false;
      if (formType !== "all" && l.form_type !== formType) return false;
      if (!q) return true;
      return [
        l.name,
        l.phone,
        l.email,
        l.company,
        l.location,
        l.referred_by,
        l.notes,
        l.service_context,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [leads, query, vertical, formType]);

  // Build the filter from the vertical paths the leads actually carry, so the
  // options can't drift from the values the forms submit.
  const verticals = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.vertical_path).filter((v): v is string => !!v))
      ).sort(),
    [leads]
  );

  const filteredAcquisitionLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return acquisitionLeads.filter((lead) => {
      if (!q) return true;
      return [
        lead.first_name,
        lead.last_name,
        lead.phone,
        lead.email,
        lead.zip_code,
        lead.lead_type,
        lead.vehicle_category,
        lead.vehicle_type,
        lead.vehicle_make,
        lead.vehicle_model,
        lead.platforms.join(" "),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [acquisitionLeads, query]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin · Leads" description="Internal admin dashboard for driver, vehicle, and quote leads." path="/admin/leads" />
      <AdminSectionHeader
        title="Leads"
        actions={
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 me-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, phone, email, company, message…"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vertical path</Label>
              <Select value={vertical} onValueChange={setVertical}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  {verticals.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Form type (leads)</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="quick_quote">Quick Quote</SelectItem>
                  <SelectItem value="partner_intake">Partner Intake</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="acquisition">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="acquisition">
              Driver & Vehicle ({filteredAcquisitionLeads.length})
            </TabsTrigger>
            <TabsTrigger value="leads">
              Leads ({filteredLeads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="acquisition">
            <Card>
              <div className="flex items-center justify-between gap-3 border-b border-border p-3">
                <p className="text-sm text-muted-foreground">
                  Structured demand and supply leads
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `acquisition-leads-${format(new Date(), "yyyy-MM-dd")}.csv`,
                      toCSV(filteredAcquisitionLeads as unknown as Record<string, unknown>[]),
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>ZIP</TableHead>
                      <TableHead>Demand / Vehicle</TableHead>
                      <TableHead>Timing / Availability</TableHead>
                      <TableHead>Budget / Mileage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAcquisitionLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(lead.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lead.lead_type === "driver_demand" ? "default" : "secondary"}>
                            {lead.lead_type === "driver_demand" ? "Driver" : "Vehicle"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.lead_priority ? <Badge variant="outline">{lead.lead_priority}</Badge> : "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </TableCell>
                        <TableCell>
                          <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                            {lead.phone}
                          </a>
                        </TableCell>
                        <TableCell>{lead.zip_code}</TableCell>
                        <TableCell className="max-w-[260px] text-sm">
                          {lead.lead_type === "driver_demand"
                            ? `${lead.vehicle_category ?? "—"} · ${lead.platforms.join(", ")}`
                            : `${lead.vehicle_year ?? ""} ${lead.vehicle_make ?? ""} ${lead.vehicle_model ?? ""}`.trim()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {lead.lead_type === "driver_demand"
                            ? lead.need_timeline ?? "—"
                            : lead.vehicle_availability ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {lead.lead_type === "driver_demand"
                            ? lead.weekly_budget_min !== null
                              ? `$${lead.weekly_budget_min}+ / wk`
                              : lead.weekly_budget_max !== null
                                ? `Under $${lead.weekly_budget_max + 1} / wk`
                                : "Not sure"
                            : lead.mileage !== null
                              ? `${lead.mileage.toLocaleString()} mi`
                              : "—"}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{lead.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {filteredAcquisitionLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                          No acquisition leads match the current search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <div className="p-3 flex justify-end border-b border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `leads-${format(new Date(), "yyyy-MM-dd")}.csv`,
                      toCSV(filteredLeads as unknown as Record<string, unknown>[])
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead>Vertical</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Referred by</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(l.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{l.form_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {l.vertical_path ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{l.name}</TableCell>
                        <TableCell>
                          <a
                            href={`tel:${l.phone}`}
                            className="text-primary hover:underline"
                          >
                            {l.phone}
                          </a>
                        </TableCell>
                        <TableCell>{l.company ?? "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {l.location ?? "—"}
                        </TableCell>
                        <TableCell>{l.needed_when ?? "—"}</TableCell>
                        <TableCell>{l.referred_by ?? "—"}</TableCell>
                        <TableCell className="max-w-[260px] truncate">
                          {l.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredLeads.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center text-muted-foreground py-8"
                        >
                          No leads match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminLeads;
