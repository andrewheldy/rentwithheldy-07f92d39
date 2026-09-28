import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, RotateCcw, Upload } from "lucide-react";
import SEO from "@/components/SEO";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatDay } from "@/lib/consigners/format";
import { listTuroImports, MAX_TURO_FILE_BYTES, submitTuroExport, type TuroImportRun } from "@/lib/turo/api";
import type { TuroImportResult } from "@/lib/turo/result";

const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

const STATUS_LABELS: Array<[keyof NonNullable<TuroImportResult["summary"]>["byStatus"], string]> = [
  ["completed", "Completed"],
  ["in_progress", "In progress"],
  ["booked", "Booked"],
  ["cancelled_by_guest", "Guest cancellations"],
  ["cancelled_by_host", "Host cancellations"],
];

function RunStatus({ run }: { run: TuroImportRun }) {
  if (run.status === "succeeded") {
    return (
      <Badge variant="outline" className="gap-1 whitespace-nowrap border-emerald-300 bg-emerald-50 font-medium text-emerald-900">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Imported
      </Badge>
    );
  }
  if (run.status === "failed") {
    return (
      <Badge variant="outline" className="gap-1 whitespace-nowrap border-rose-300 bg-rose-50 font-medium text-rose-900">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Stopped
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="whitespace-nowrap font-medium">
      Running
    </Badge>
  );
}

export default function AdminTuroImport() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<TuroImportResult | null>(null);
  const runsQuery = useQuery({ queryKey: ["turo-imports"], queryFn: listTuroImports });

  const check = useMutation({
    mutationFn: (selected: { name: string; text: string }) => submitTuroExport(selected, "check"),
    onSuccess: setResult,
    onError: (error: Error) => toast({ title: "Could not check the file", description: error.message, variant: "destructive" }),
  });

  const commit = useMutation({
    mutationFn: (selected: { name: string; text: string }) => submitTuroExport(selected, "import"),
    onSuccess: (next) => {
      setResult(next);
      void queryClient.invalidateQueries({ queryKey: ["turo-imports"] });
      if (next.problems.length === 0 && next.summary) {
        toast({ title: "Turo trips imported", description: `${plural(next.summary.trips, "trip")} from ${next.fileName}.` });
      }
    },
    onError: (error: Error) => {
      void queryClient.invalidateQueries({ queryKey: ["turo-imports"] });
      toast({ title: "Import stopped", description: error.message, variant: "destructive" });
    },
  });

  const busy = check.isPending || commit.isPending;

  const chooseFile = async (selected: File | undefined) => {
    setResult(null);
    setFileError(null);
    setFile(null);
    if (!selected) return;
    if (!/\.csv$/i.test(selected.name)) {
      setFileError("Choose the trip earnings export from Turo. It's a .csv file.");
      return;
    }
    if (selected.size > MAX_TURO_FILE_BYTES) {
      setFileError("The file is larger than 4 MB. Export a shorter date range from Turo and upload it in parts.");
      return;
    }
    const next = { name: selected.name, text: await selected.text() };
    setFile(next);
    check.mutate(next);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const summary = result?.summary ?? null;
  const blocked = (result?.problems.length ?? 0) > 0;
  const imported = result?.mode === "import" && !blocked;
  const nothingToChange =
    summary !== null &&
    summary.newTrips === 0 &&
    summary.updatedTrips === 0 &&
    summary.earningsRows.new === 0 &&
    summary.earningsRows.updated === 0 &&
    summary.earningsRows.removed === 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Turo import · Rent With Heldy Admin" description="Import Turo trip earnings." path="/admin/turo-import" noIndex />
      <AdminSectionHeader title="Turo import" />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-text">Owner earnings</p>
          <h2 className="mt-1 text-3xl font-semibold">Turo import</h2>
          <p className="mt-2 text-muted-foreground">
            Upload Turo's trip earnings export (CSV). You'll see what changes before anything is saved. Uploading an
            overlapping date range again updates trips instead of adding them twice. Renter names and addresses are never
            stored.
          </p>
        </div>

        <Card className="p-4 sm:p-5">
          <Label htmlFor="turo-file" className="text-base">
            Trip earnings export
          </Label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              id="turo-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={busy}
              aria-describedby="turo-file-hint"
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            <Button asChild variant="outline" disabled={busy}>
              <label htmlFor="turo-file" className="cursor-pointer">
                <FileSpreadsheet className="me-2 h-4 w-4" aria-hidden="true" />
                {file ? "Choose a different file" : "Choose CSV file"}
              </label>
            </Button>
            {file && (
              <span className="min-w-0 break-all text-sm font-medium" dir="ltr">
                {file.name}
              </span>
            )}
            {check.isPending && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking the file…
              </span>
            )}
          </div>
          {fileError ? (
            <p id="turo-file-hint" className="mt-2 text-sm text-destructive" role="alert">
              {fileError}
            </p>
          ) : (
            <p id="turo-file-hint" className="mt-2 text-sm text-muted-foreground">
              Download the trip earnings export (CSV) from your Turo host account. Any date range works.
            </p>
          )}
        </Card>

        {result && (
          <section aria-labelledby="turo-result-heading" className="space-y-4">
            <h3 id="turo-result-heading" className="text-xl font-semibold">
              {imported ? "Import complete" : blocked ? "Fix these before importing" : "Ready to import"}
            </h3>

            {blocked && (
              <Card className="border-destructive/60 p-4 sm:p-5" role="alert">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                  <div className="min-w-0 space-y-2">
                    <p className="font-medium">Nothing was saved. The file has {plural(result.problems.length, "problem")}:</p>
                    <ul className="list-disc space-y-1.5 ps-5 text-sm">
                      {result.problems.map((problem) => (
                        <li key={problem.message} className="break-words">
                          {problem.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {imported && (
              <Card className="border-emerald-300 bg-emerald-50/60 p-4 text-emerald-950 sm:p-5" role="status">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <p>
                    Saved {plural(summary!.trips, "trip")} from <span dir="ltr">{result.fileName}</span>. Owner dashboards now
                    include these earnings.
                  </p>
                </div>
              </Card>
            )}

            {summary && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Trips in file</p>
                    <p className="mt-1 text-2xl font-semibold">{summary.trips.toLocaleString("en-US")}</p>
                    {summary.firstTripStart && summary.lastTripStart && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Starting {formatDay(summary.firstTripStart)} – {formatDay(summary.lastTripStart)}
                      </p>
                    )}
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">{imported ? "Saved" : "Will change"}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {(summary.newTrips + summary.updatedTrips).toLocaleString("en-US")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {summary.newTrips.toLocaleString("en-US")} new · {summary.updatedTrips.toLocaleString("en-US")} updated ·{" "}
                      {summary.unchangedTrips.toLocaleString("en-US")} unchanged
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Turo earnings collected</p>
                    <p className="mt-1 text-2xl font-semibold">{money(summary.totals.earningsCents)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Completed trips and paid cancellations</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Rental Revenue</p>
                    <p className="mt-1 text-2xl font-semibold">{money(summary.totals.rentalRevenueCents)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Shared with owners</p>
                  </Card>
                </div>

                <Card className="p-4 sm:p-5">
                  <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Excluded (delivery, tolls, fuel, cleaning…)</dt>
                      <dd className="font-medium">{money(summary.totals.excludedCents)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Awaiting a decision (cancellation and other fees)</dt>
                      <dd className="font-medium">{money(summary.totals.unclassifiedCents)}</dd>
                    </div>
                    {STATUS_LABELS.map(([key, label]) => (
                      <div key={key} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium">{summary.byStatus[key].toLocaleString("en-US")}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Earnings rows (new · updated · removed)</dt>
                      <dd className="font-medium">
                        {summary.earningsRows.new} · {summary.earningsRows.updated} · {summary.earningsRows.removed}
                      </dd>
                    </div>
                  </dl>
                  {(result.droppedColumns.length > 0 || result.extraColumns.length > 0) && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      {result.droppedColumns.length > 0 && <>Not stored: {result.droppedColumns.join(", ")}. </>}
                      {result.extraColumns.length > 0 && <>Kept for reference only: {result.extraColumns.join(", ")}.</>}
                    </p>
                  )}
                </Card>

                {summary.vehicles.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vehicle</TableHead>
                            <TableHead className="text-end">Trips</TableHead>
                            <TableHead className="text-end">Completed</TableHead>
                            <TableHead className="text-end">Earnings</TableHead>
                            <TableHead className="text-end">Rental Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summary.vehicles.map((vehicle) => (
                            <TableRow key={vehicle.vehicleId}>
                              <TableCell className="min-w-44 font-medium">{vehicle.name}</TableCell>
                              <TableCell className="text-end tabular-nums">{vehicle.trips}</TableCell>
                              <TableCell className="text-end tabular-nums">{vehicle.completed}</TableCell>
                              <TableCell className="text-end tabular-nums">{money(vehicle.earningsCents)}</TableCell>
                              <TableCell className="text-end tabular-nums">{money(vehicle.rentalRevenueCents)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}
              </>
            )}

            <div className="flex flex-wrap gap-2">
              {!imported && !blocked && file && (
                <Button size="lg" disabled={busy || nothingToChange} onClick={() => commit.mutate(file)}>
                  {commit.isPending ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="me-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {nothingToChange ? "Already up to date" : `Import ${plural(summary?.trips ?? 0, "trip")}`}
                </Button>
              )}
              <Button variant="outline" size="lg" disabled={busy} onClick={reset}>
                <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
                {imported ? "Import another file" : "Start over"}
              </Button>
            </div>
          </section>
        )}

        <section aria-labelledby="turo-history-heading" className="space-y-3">
          <h3 id="turo-history-heading" className="text-xl font-semibold">
            Recent imports
          </h3>
          {runsQuery.isLoading ? (
            <Card className="p-6 text-center text-muted-foreground">Loading…</Card>
          ) : runsQuery.error ? (
            <Card className="border-destructive p-4 text-sm text-destructive">{(runsQuery.error as Error).message}</Card>
          ) : (runsQuery.data ?? []).length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No imports from this page yet. The history loaded on Sep 24, 2026 was imported directly.
            </Card>
          ) : (
            <ul className="grid gap-2">
              {(runsQuery.data ?? []).map((run) => (
                <li key={run.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
                    <div className="min-w-0">
                      <p className="break-all font-medium" dir="ltr">
                        {run.metadata?.file_name ?? "Turo export"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {new Date(run.started_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                        {run.metadata?.trips !== undefined && ` · ${plural(run.metadata.trips, "trip")}`}
                        {run.metadata?.new_trips !== undefined && ` · ${run.metadata.new_trips} new, ${run.metadata.updated_trips ?? 0} updated`}
                        {run.metadata?.totals?.earningsCents !== undefined && ` · ${money(run.metadata.totals.earningsCents)}`}
                      </p>
                      {run.error && <p className="mt-1 text-sm text-destructive">{run.error}</p>}
                    </div>
                    <RunStatus run={run} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
