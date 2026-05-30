import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Download, RefreshCw, Search, ArrowLeft } from "lucide-react";
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

type Inquiry = {
  id: string;
  vehicle_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: string | null;
  vertical_path: string | null;
  created_at: string;
};

type EventLog = {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  vertical_path: string | null;
  severity: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const VERTICALS = [
  "all",
  "body-shop",
  "cruise-port",
  "hotel",
  "loss-of-use",
  "airport",
  "vehicle-inquiry",
  "direct",
];

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

const severityVariant: Record<string, "default" | "secondary" | "destructive"> =
  {
    info: "secondary",
    warn: "default",
    error: "destructive",
  };

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [vertical, setVertical] = useState("all");
  const [formType, setFormType] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [leadsRes, inqRes, evRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("booking_inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("event_logs")
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
    if (inqRes.error)
      toast({
        title: "Inquiries load failed",
        description: inqRes.error.message,
        variant: "destructive",
      });
    if (evRes.error)
      toast({
        title: "Event logs load failed",
        description: evRes.error.message,
        variant: "destructive",
      });

    setLeads((leadsRes.data as Lead[]) ?? []);
    setInquiries((inqRes.data as Inquiry[]) ?? []);
    setEvents((evRes.data as EventLog[]) ?? []);
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

  const filteredInquiries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (vertical !== "all" && (i.vertical_path ?? "vehicle-inquiry") !== vertical)
        return false;
      if (!q) return true;
      return [i.customer_name, i.customer_email, i.customer_phone, i.message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [inquiries, query, vertical]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (vertical !== "all" && e.vertical_path !== vertical) return false;
      if (!q) return true;
      return [e.event_type, e.message, e.entity_id, JSON.stringify(e.metadata)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [events, query, vertical]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin · Leads & Inquiries" description="Internal admin dashboard for leads, booking inquiries, and event logs." path="/admin/leads" />
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Site
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">
              Leads & Inquiries
            </h1>
          </div>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </header>

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
                  {VERTICALS.map((v) => (
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

        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads">
              Leads ({filteredLeads.length})
            </TabsTrigger>
            <TabsTrigger value="inquiries">
              Booking Inquiries ({filteredInquiries.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              Event Log ({filteredEvents.length})
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="inquiries">
            <Card>
              <div className="p-3 flex justify-end border-b border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `inquiries-${format(new Date(), "yyyy-MM-dd")}.csv`,
                      toCSV(
                        filteredInquiries as unknown as Record<
                          string,
                          unknown
                        >[]
                      )
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
                      <TableHead>Vertical</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInquiries.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(i.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {i.vertical_path ?? "vehicle-inquiry"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {i.customer_name}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`tel:${i.customer_phone}`}
                            className="text-primary hover:underline"
                          >
                            {i.customer_phone}
                          </a>
                        </TableCell>
                        <TableCell className="text-xs">{i.customer_email}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {i.start_date} → {i.end_date}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{i.status ?? "pending"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate">
                          {i.message ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredInquiries.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No inquiries match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <div className="p-3 flex justify-end border-b border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `events-${format(new Date(), "yyyy-MM-dd")}.csv`,
                      toCSV(
                        filteredEvents as unknown as Record<string, unknown>[]
                      )
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
                      <TableHead>Severity</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Vertical</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(e.created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityVariant[e.severity] ?? "secondary"}>
                            {e.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {e.event_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {e.vertical_path ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.entity_type ?? "—"}
                          {e.entity_id ? ` · ${e.entity_id.slice(0, 8)}` : ""}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs">
                          {e.message ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs font-mono text-muted-foreground">
                          {Object.keys(e.metadata ?? {}).length > 0
                            ? JSON.stringify(e.metadata)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEvents.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No events match the current filters.
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
