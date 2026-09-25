import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  assignVehicle,
  type AdminAccount,
  type AssignableVehicle,
  type Consigner,
  type LinkableAgreement,
} from "@/lib/consigners/api";
import {
  blocksNewAssignment,
  formatDay,
  formatPercent,
  operatorPercent,
  parseOwnerPercent,
  providerLabel,
  todayISO,
  vehicleDetail,
  vehicleName,
} from "@/lib/consigners/format";

const NO_AGREEMENT = "none";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AdminAccount[];
  vehicles: AssignableVehicle[];
  agreements: LinkableAgreement[];
  consigners: Consigner[];
  /** Pre-selects an account, e.g. "Assign another vehicle" on a consigner. */
  defaultUserId?: string;
};

type Errors = Partial<Record<"account" | "legalName" | "vehicle" | "ownerPercent" | "effectiveFrom", string>>;

export function AssignVehicleDialog({ open, onOpenChange, accounts, vehicles, agreements, consigners, defaultUserId }: Props) {
  const queryClient = useQueryClient();
  const today = todayISO();
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [ownerPercentInput, setOwnerPercentInput] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [dateTouched, setDateTouched] = useState(false);
  const [agreementId, setAgreementId] = useState(NO_AGREEMENT);
  const [errors, setErrors] = useState<Errors>({});

  const clearError = (field: keyof Errors) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const consignerByUser = useMemo(
    () => new Map(consigners.filter((c) => c.user_id).map((c) => [c.user_id as string, c])),
    [consigners],
  );

  const selectAccount = (id: string) => {
    setUserId(id);
    const account = accounts.find((a) => a.user_id === id);
    const existing = consignerByUser.get(id);
    setLegalName(existing?.legal_name ?? account?.full_name ?? "");
    setPhone(existing?.phone ?? "");
    clearError("account");
    clearError("legalName");
  };

  // Reset every time the dialog opens so a previous attempt never leaks in.
  useEffect(() => {
    if (!open) return;
    setUserId("");
    setLegalName("");
    setPhone("");
    setVehicleId("");
    setOwnerPercentInput("");
    setEffectiveFrom(todayISO());
    setDateTouched(false);
    setAgreementId(NO_AGREEMENT);
    setErrors({});
    if (defaultUserId) selectAccount(defaultUserId);
    // selectAccount reads the latest lists; re-running on their change would wipe edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultUserId]);

  // Vehicles that already have an owner today or later can't be assigned again.
  const takenBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const consigner of consigners) {
      for (const assignment of consigner.assignments) {
        if (blocksNewAssignment(assignment, today)) map.set(assignment.vehicle_id, consigner.legal_name);
      }
    }
    return map;
  }, [consigners, today]);

  const selectedAccount = accounts.find((a) => a.user_id === userId);
  const ownerPercent = parseOwnerPercent(ownerPercentInput);

  const chooseVehicle = (id: string) => {
    setVehicleId(id);
    const vehicle = vehicles.find((v) => v.id === id);
    // Default the start to the day the car went into service, until the admin picks a date.
    if (!dateTouched && vehicle?.in_service_on) setEffectiveFrom(vehicle.in_service_on);
    clearError("vehicle");
  };

  const mutation = useMutation({
    mutationFn: assignVehicle,
    onSuccess: () => {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      toast({
        title: "Vehicle assigned",
        description: `${vehicle ? vehicleName(vehicle) : "The vehicle"} is now assigned to ${legalName.trim()}.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-consigners"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      onOpenChange(false);
    },
    onError: (error: Error) =>
      toast({ title: "Could not assign the vehicle", description: error.message, variant: "destructive" }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (!userId) next.account = "Choose the owner's account.";
    if (!legalName.trim()) next.legalName = "Enter the owner's legal name.";
    if (!vehicleId) next.vehicle = "Choose a vehicle.";
    if (ownerPercent === null) next.ownerPercent = "Enter a share from 0 to 100 (up to two decimals).";
    if (!effectiveFrom) next.effectiveFrom = "Choose the start date.";
    setErrors(next);
    if (Object.keys(next).length > 0 || ownerPercent === null) return;
    mutation.mutate({
      userId,
      vehicleId,
      ownerPercent,
      effectiveFrom,
      legalName: legalName.trim(),
      phone: phone.trim(),
      agreementId: agreementId === NO_AGREEMENT ? undefined : agreementId,
    });
  };

  const errorId = (field: keyof Errors) => (errors[field] ? `assign-${field}-error` : undefined);
  const fieldError = (field: keyof Errors) =>
    errors[field] ? (
      <p id={`assign-${field}-error`} className="text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a vehicle</DialogTitle>
          <DialogDescription>
            Links a signed-up account to a consigned vehicle and sets the owner's share. The account gets
            consigner access for that vehicle from the start date.
          </DialogDescription>
        </DialogHeader>

        <form id="assign-vehicle-form" onSubmit={submit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="assign-account">Owner's account</Label>
            <Popover open={accountPickerOpen} onOpenChange={setAccountPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="assign-account"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={accountPickerOpen}
                  aria-invalid={Boolean(errors.account)}
                  aria-describedby={errorId("account") ?? "assign-account-hint"}
                  className="h-auto min-h-10 w-full justify-between whitespace-normal py-2 text-start font-normal"
                >
                  {selectedAccount ? (
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{selectedAccount.full_name || selectedAccount.email}</span>
                      <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                        {selectedAccount.email} · {providerLabel(selectedAccount.providers)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Search by name or email</span>
                  )}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search accounts…" />
                  <CommandList>
                    <CommandEmpty>No account matches. The owner must sign up first.</CommandEmpty>
                    <CommandGroup>
                      {accounts.map((account) => (
                        <CommandItem
                          key={account.user_id}
                          value={`${account.full_name ?? ""} ${account.email}`}
                          disabled={!account.email_confirmed}
                          onSelect={() => {
                            selectAccount(account.user_id);
                            setAccountPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn("me-2 h-4 w-4 shrink-0", userId === account.user_id ? "opacity-100" : "opacity-0")}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{account.full_name || account.email}</span>
                            <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                              {account.email} · {providerLabel(account.providers)}
                            </span>
                          </span>
                          <span className="ms-2 shrink-0 text-xs text-muted-foreground">
                            {!account.email_confirmed
                              ? "Email not confirmed"
                              : account.is_admin
                                ? "Admin"
                                : account.is_consigner
                                  ? "Consigner"
                                  : null}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {fieldError("account") ?? (
              <p id="assign-account-hint" className="text-sm text-muted-foreground">
                The owner signs up at /auth with email or Google first. Accounts appear here once their email
                is confirmed.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assign-legal-name">Legal name</Label>
              <Input
                id="assign-legal-name"
                value={legalName}
                maxLength={160}
                autoComplete="off"
                aria-invalid={Boolean(errors.legalName)}
                aria-describedby={errorId("legalName")}
                onChange={(event) => {
                  setLegalName(event.target.value);
                  clearError("legalName");
                }}
              />
              {fieldError("legalName")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-phone">Phone (optional)</Label>
              <Input
                id="assign-phone"
                type="tel"
                dir="ltr"
                value={phone}
                autoComplete="off"
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assign-vehicle">Vehicle</Label>
            <Select value={vehicleId} onValueChange={chooseVehicle}>
              <SelectTrigger id="assign-vehicle" aria-invalid={Boolean(errors.vehicle)} aria-describedby={errorId("vehicle")}>
                <SelectValue placeholder="Choose a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => {
                  const owner = takenBy.get(vehicle.id);
                  return (
                    <SelectItem key={vehicle.id} value={vehicle.id} disabled={Boolean(owner)}>
                      {vehicleName(vehicle)}
                      {vehicleDetail(vehicle) && ` · ${vehicleDetail(vehicle)}`}
                      {owner && ` (assigned to ${owner})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {fieldError("vehicle")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assign-owner-percent">Owner's share (%)</Label>
              <Input
                id="assign-owner-percent"
                inputMode="decimal"
                placeholder="e.g. 60"
                value={ownerPercentInput}
                aria-invalid={Boolean(errors.ownerPercent)}
                aria-describedby={errorId("ownerPercent") ?? "assign-owner-percent-hint"}
                onChange={(event) => {
                  setOwnerPercentInput(event.target.value);
                  clearError("ownerPercent");
                }}
              />
              {fieldError("ownerPercent") ?? (
                <p id="assign-owner-percent-hint" className="text-sm text-muted-foreground">
                  {ownerPercent === null
                    ? "The owner's dashboard shows this share of rental revenue."
                    : `Rent With Heldy keeps ${formatPercent(operatorPercent(ownerPercent))}.`}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-effective-from">Share starts</Label>
              <Input
                id="assign-effective-from"
                type="date"
                value={effectiveFrom}
                aria-invalid={Boolean(errors.effectiveFrom)}
                aria-describedby={errorId("effectiveFrom") ?? "assign-effective-from-hint"}
                onChange={(event) => {
                  setEffectiveFrom(event.target.value);
                  setDateTouched(true);
                  clearError("effectiveFrom");
                }}
              />
              {fieldError("effectiveFrom") ?? (
                <p id="assign-effective-from-hint" className="text-sm text-muted-foreground">
                  Earnings collected from this day on count toward the owner.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assign-agreement">Consignment agreement (optional)</Label>
            <Select value={agreementId} onValueChange={setAgreementId}>
              <SelectTrigger id="assign-agreement" aria-describedby="assign-agreement-hint">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_AGREEMENT}>No agreement yet</SelectItem>
                {agreements.map((agreement) => (
                  <SelectItem key={agreement.id} value={agreement.id}>
                    {agreement.agreement_number} · {agreement.template?.name ?? "Agreement"} ·{" "}
                    {formatDay(agreement.created_at.slice(0, 10))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="assign-agreement-hint" className="text-sm text-muted-foreground">
              Once it's fully signed, the owner can download it from their dashboard.
            </p>
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="assign-vehicle-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Assign vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
