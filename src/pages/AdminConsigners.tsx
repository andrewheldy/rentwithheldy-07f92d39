import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, CheckCircle2, CircleSlash, Loader2, Plus, UserRoundX, UsersRound } from "lucide-react";
import SEO from "@/components/SEO";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { AssignVehicleDialog } from "@/components/admin/consigners/AssignVehicleDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  endAssignment,
  listAccounts,
  listAssignableVehicles,
  listConsigners,
  listLinkableAgreements,
  setDashboardAccess,
  type Assignment,
  type Consigner,
} from "@/lib/consigners/api";
import {
  formatPercent,
  periodLabel,
  periodState,
  todayISO,
  vehicleDetail,
  vehicleName,
  type PeriodState,
} from "@/lib/consigners/format";

const periodBadge: Record<PeriodState, { label: string; className: string }> = {
  current: { label: "Current", className: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  upcoming: { label: "Upcoming", className: "border-sky-300 bg-sky-50 text-sky-900" },
  ended: { label: "Ended", className: "border-border bg-muted text-muted-foreground" },
};

type AccessState = "granted" | "removed" | "no-account" | "unknown";

function AccessBadge({ state }: { state: AccessState }) {
  if (state === "granted") {
    return (
      <Badge variant="outline" className="gap-1.5 whitespace-nowrap border-emerald-300 bg-emerald-50 font-medium text-emerald-900">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Dashboard access
      </Badge>
    );
  }
  if (state === "removed") {
    return (
      <Badge variant="outline" className="gap-1.5 whitespace-nowrap border-amber-300 bg-amber-50 font-medium text-amber-900">
        <CircleSlash className="h-3.5 w-3.5" aria-hidden="true" /> Access removed
      </Badge>
    );
  }
  if (state === "no-account") {
    return (
      <Badge variant="outline" className="gap-1.5 whitespace-nowrap font-medium text-muted-foreground">
        <UserRoundX className="h-3.5 w-3.5" aria-hidden="true" /> No account linked
      </Badge>
    );
  }
  return null;
}

export default function AdminConsigners() {
  const queryClient = useQueryClient();
  const today = todayISO();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string | undefined>();
  const [ending, setEnding] = useState<{ assignment: Assignment; consigner: Consigner } | null>(null);
  const [endDate, setEndDate] = useState(today);
  const [accessTarget, setAccessTarget] = useState<{ consigner: Consigner; enable: boolean } | null>(null);

  const consignersQuery = useQuery({ queryKey: ["admin-consigners"], queryFn: listConsigners });
  const accountsQuery = useQuery({ queryKey: ["admin-accounts"], queryFn: listAccounts });
  const vehiclesQuery = useQuery({ queryKey: ["admin-assignable-vehicles"], queryFn: listAssignableVehicles });
  const agreementsQuery = useQuery({ queryKey: ["admin-linkable-agreements"], queryFn: listLinkableAgreements });

  const consigners = useMemo(() => consignersQuery.data ?? [], [consignersQuery.data]);
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.user_id, a])), [accounts]);

  const accessState = (consigner: Consigner): AccessState => {
    if (!consigner.user_id) return "no-account";
    const account = accountById.get(consigner.user_id);
    if (!account) return "unknown";
    return account.is_consigner ? "granted" : "removed";
  };

  const openAssign = (userId?: string) => {
    setAssignUserId(userId);
    setAssignOpen(true);
  };

  const endMutation = useMutation({
    mutationFn: ({ id, lastDay }: { id: string; lastDay: string }) => endAssignment(id, lastDay, todayISO()),
    onSuccess: () => {
      toast({ title: "Assignment updated", description: "The owner's share stops after the last day you set." });
      void queryClient.invalidateQueries({ queryKey: ["admin-consigners"] });
      setEnding(null);
    },
    onError: (error: Error) => toast({ title: "Could not end the assignment", description: error.message, variant: "destructive" }),
  });

  const accessMutation = useMutation({
    mutationFn: ({ userId, enable }: { userId: string; enable: boolean }) => setDashboardAccess(userId, enable),
    onSuccess: (_, { enable }) => {
      toast({ title: enable ? "Dashboard access restored" : "Dashboard access removed" });
      void queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setAccessTarget(null);
    },
    onError: (error: Error) => toast({ title: "Could not change access", description: error.message, variant: "destructive" }),
  });

  const submitEnd = (event: FormEvent) => {
    event.preventDefault();
    if (!ending || !endDate || endDate < ending.assignment.effective_from) return;
    endMutation.mutate({ id: ending.assignment.id, lastDay: endDate });
  };

  const loadError = consignersQuery.error ?? vehiclesQuery.error;
  const canAssign = !accountsQuery.isLoading && !vehiclesQuery.isLoading && !accountsQuery.error && !vehiclesQuery.error;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Consigners · Rent With Heldy Admin" description="Internal consigner management." path="/admin/consigners" noIndex />
      <AdminSectionHeader title="Consigners" />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Owner access</p>
            <h2 className="mt-1 text-3xl font-semibold">Consigners</h2>
            <p className="mt-2 text-muted-foreground">
              Owners create their own account with email or Google. Assign their vehicle here to link the account,
              set the owner's share and give them access to their vehicle's figures.
            </p>
          </div>
          <Button size="lg" onClick={() => openAssign()} disabled={!canAssign}>
            <Plus className="me-2 h-4 w-4" aria-hidden="true" /> Assign vehicle
          </Button>
        </div>

        {accountsQuery.error && (
          <Card className="border-destructive p-4 text-sm text-destructive" role="alert">
            Could not load accounts: {(accountsQuery.error as Error).message}
          </Card>
        )}

        {consignersQuery.isLoading ? (
          <Card className="p-10 text-center text-muted-foreground">Loading consigners…</Card>
        ) : loadError ? (
          <Card className="border-destructive p-6 text-destructive" role="alert">
            {(loadError as Error).message}
          </Card>
        ) : consigners.length === 0 ? (
          <Card className="p-10 text-center">
            <UsersRound className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">No consigners yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Ask the owner to create an account at rentwithheldy.com/auth, then assign their vehicle and share.
            </p>
            <Button className="mt-5" onClick={() => openAssign()} disabled={!canAssign}>
              <Plus className="me-2 h-4 w-4" aria-hidden="true" /> Assign vehicle
            </Button>
          </Card>
        ) : (
          <ul className="grid gap-4" aria-label="Consigners">
            {consigners.map((consigner) => {
              const access = accessState(consigner);
              return (
                <li key={consigner.id}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">{consigner.legal_name}</h3>
                        <p className="mt-0.5 break-all text-sm text-muted-foreground">
                          <span dir="ltr">{consigner.email}</span>
                          {consigner.phone && (
                            <>
                              {" · "}
                              <span dir="ltr">{consigner.phone}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <AccessBadge state={access} />
                    </div>

                    {consigner.assignments.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">No vehicles assigned.</p>
                    ) : (
                      <ul className="mt-4 divide-y divide-border rounded-lg border border-border" aria-label={`Vehicles for ${consigner.legal_name}`}>
                        {consigner.assignments.map((assignment) => {
                          const state = periodState(assignment, today);
                          const canEnd = assignment.effective_to === null || assignment.effective_to >= today;
                          return (
                            <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <Car className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                                <div className="min-w-0">
                                  <p className="font-medium">
                                    {assignment.vehicle ? vehicleName(assignment.vehicle) : "Vehicle"}
                                    {assignment.vehicle && vehicleDetail(assignment.vehicle) && (
                                      <span className="font-normal text-muted-foreground"> · {vehicleDetail(assignment.vehicle)}</span>
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-sm text-muted-foreground">
                                    Owner {formatPercent(assignment.owner_percent)} · Rent With Heldy{" "}
                                    {formatPercent(assignment.operator_percent)} · {periodLabel(assignment, today)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`whitespace-nowrap font-medium ${periodBadge[state].className}`}>
                                  {periodBadge[state].label}
                                </Badge>
                                {canEnd && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEndDate(today < assignment.effective_from ? assignment.effective_from : today);
                                      setEnding({ assignment, consigner });
                                    }}
                                  >
                                    {assignment.effective_to ? "Change end date" : "End assignment"}
                                  </Button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {consigner.user_id && (
                        <Button variant="outline" size="sm" onClick={() => openAssign(consigner.user_id ?? undefined)} disabled={!canAssign}>
                          <Plus className="me-1.5 h-4 w-4" aria-hidden="true" /> Assign another vehicle
                        </Button>
                      )}
                      {access === "granted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setAccessTarget({ consigner, enable: false })}
                        >
                          Remove dashboard access
                        </Button>
                      )}
                      {access === "removed" && (
                        <Button variant="ghost" size="sm" onClick={() => setAccessTarget({ consigner, enable: true })}>
                          Restore dashboard access
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <AssignVehicleDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        accounts={accounts}
        vehicles={vehiclesQuery.data ?? []}
        agreements={agreementsQuery.data ?? []}
        consigners={consigners}
        defaultUserId={assignUserId}
      />

      <Dialog open={ending !== null} onOpenChange={(open) => !open && !endMutation.isPending && setEnding(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End assignment</DialogTitle>
            <DialogDescription>
              {ending && (
                <>
                  {ending.assignment.vehicle ? vehicleName(ending.assignment.vehicle) : "This vehicle"} stops counting toward{" "}
                  {ending.consigner.legal_name} after the last day below. Their history up to that day stays visible to them.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form id="end-assignment-form" onSubmit={submitEnd} className="space-y-1.5">
            <Label htmlFor="end-assignment-date">Last day of the owner's share</Label>
            <Input
              id="end-assignment-date"
              type="date"
              required
              min={ending?.assignment.effective_from}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </form>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEnding(null)} disabled={endMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" form="end-assignment-form" disabled={endMutation.isPending || !endDate}>
              {endMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Save end date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={accessTarget !== null} onOpenChange={(open) => !open && !accessMutation.isPending && setAccessTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{accessTarget?.enable ? "Restore dashboard access?" : "Remove dashboard access?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {accessTarget?.enable
                ? `${accessTarget.consigner.legal_name} will be able to sign in and see their assigned vehicles again.`
                : `${accessTarget?.consigner.legal_name} will no longer see any vehicle figures. Their assignments and history are kept, and you can restore access later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={accessMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={accessMutation.isPending}
              className={accessTarget?.enable ? undefined : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
              onClick={(event) => {
                event.preventDefault();
                if (accessTarget?.consigner.user_id) {
                  accessMutation.mutate({ userId: accessTarget.consigner.user_id, enable: accessTarget.enable });
                }
              }}
            >
              {accessTarget?.enable ? "Restore access" : "Remove access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
