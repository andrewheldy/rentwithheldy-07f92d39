import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import type { AgreementParty, AgreementVehicle, VehicleConsignmentAgreementData } from "@/lib/agreements/types";

type Props = {
  value: VehicleConsignmentAgreementData;
  onChange: (value: VehicleConsignmentAgreementData) => void;
  disabled?: boolean;
};

export function AgreementForm({ value, onChange, disabled = false }: Props) {
  const update = (recipe: (draft: VehicleConsignmentAgreementData) => void) => {
    const draft = structuredClone(value);
    recipe(draft);
    onChange(draft);
  };
  const updateOwner = (index: number, patch: Partial<AgreementParty>) => update((draft) => Object.assign(draft.owners[index], patch));
  const updateVehicle = (index: number, patch: Partial<AgreementVehicle>) => update((draft) => Object.assign(draft.vehicles[index], patch));

  return (
    <fieldset disabled={disabled} className="space-y-6">
      <legend className="sr-only">Agreement details</legend>
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Agreement terms</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Effective date" htmlFor="effective-date"><Input id="effective-date" type="date" required value={value.effectiveDate} onChange={(event) => update((draft) => { draft.effectiveDate = event.target.value; })} /></Field>
          <Field label="Trial start" htmlFor="trial-start"><Input id="trial-start" type="date" required value={value.trial.startDate} onChange={(event) => update((draft) => { draft.trial.startDate = event.target.value; })} /></Field>
          <Field label="Review / end date" htmlFor="trial-review"><Input id="trial-review" type="date" required value={value.trial.reviewDate} onChange={(event) => update((draft) => { draft.trial.reviewDate = event.target.value; })} /></Field>
          <div className="space-y-1.5"><Label htmlFor="payment-cadence">Payment schedule</Label><Select value={value.paymentCadence || undefined} onValueChange={(next: "bi_weekly" | "monthly") => update((draft) => { draft.paymentCadence = next; })}><SelectTrigger id="payment-cadence"><SelectValue placeholder="Choose before sending" /></SelectTrigger><SelectContent><SelectItem value="bi_weekly">Bi-weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
          <Field label="Rent With Heldy share (%)" htmlFor="operator-share"><Input id="operator-share" type="number" inputMode="decimal" min="0" max="100" required value={value.economics.operatorPercent} onChange={(event) => update((draft) => { draft.economics.operatorPercent = Number(event.target.value); draft.economics.ownerPercent = 100 - Number(event.target.value); })} /></Field>
          <Field label="Vehicle Owners share (%)" htmlFor="owner-share"><Input id="owner-share" type="number" inputMode="decimal" min="0" max="100" required value={value.economics.ownerPercent} onChange={(event) => update((draft) => { draft.economics.ownerPercent = Number(event.target.value); draft.economics.operatorPercent = 100 - Number(event.target.value); })} /></Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Rent With Heldy signer</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name" htmlFor="operator-signer-name"><Input id="operator-signer-name" autoComplete="name" required value={value.operator.signer.fullName} onChange={(event) => update((draft) => { draft.operator.signer.fullName = event.target.value; })} /></Field>
          <Field label="Email" htmlFor="operator-signer-email"><Input id="operator-signer-email" type="email" autoComplete="email" required value={value.operator.signer.email} onChange={(event) => update((draft) => { draft.operator.signer.email = event.target.value; })} /></Field>
          <Field label="Phone" htmlFor="operator-signer-phone"><Input id="operator-signer-phone" type="tel" autoComplete="tel" value={value.operator.signer.phone} onChange={(event) => update((draft) => { draft.operator.signer.phone = event.target.value; })} /></Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Vehicle owners</h2><p className="mt-1 text-sm text-muted-foreground">Each owner receives a signer-specific secure link.</p></div><Button type="button" variant="outline" onClick={() => update((draft) => { draft.owners.push({ fullName: "", email: "", phone: "", address: "", role: "Vehicle Owner", required: false }); })}><Plus className="me-2 h-4 w-4" /> Add owner</Button></div>
        <div className="mt-5 space-y-6">
          {value.owners.map((owner, index) => (
            <div key={index} className="space-y-4">
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between"><h3 className="font-semibold">Owner {index + 1}</h3>{value.owners.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => update((draft) => { draft.owners.splice(index, 1); })}><Trash2 className="me-2 h-4 w-4" /> Remove</Button>}</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Full name" htmlFor={`owner-${index}-name`}><Input id={`owner-${index}-name`} autoComplete="name" required value={owner.fullName} onChange={(event) => updateOwner(index, { fullName: event.target.value })} /></Field>
                <Field label="Email" htmlFor={`owner-${index}-email`}><Input id={`owner-${index}-email`} type="email" autoComplete="email" required value={owner.email} onChange={(event) => updateOwner(index, { email: event.target.value })} /></Field>
                <Field label="Phone" htmlFor={`owner-${index}-phone`}><Input id={`owner-${index}-phone`} type="tel" autoComplete="tel" value={owner.phone} onChange={(event) => updateOwner(index, { phone: event.target.value })} /></Field>
                <Field label="Address (optional)" htmlFor={`owner-${index}-address`}><Input id={`owner-${index}-address`} autoComplete="street-address" value={owner.address ?? ""} onChange={(event) => updateOwner(index, { address: event.target.value })} /></Field>
              </div>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium"><Checkbox checked={owner.required} onCheckedChange={(checked) => updateOwner(index, { required: checked === true })} /> Required signer</label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Vehicles</h2><p className="mt-1 text-sm text-muted-foreground">All vehicle details become part of the frozen agreement.</p></div><Button type="button" variant="outline" onClick={() => update((draft) => { draft.vehicles.push({ year: new Date().getFullYear(), make: "", model: "", vin: "", mileage: 0, licensePlate: "" }); })}><Plus className="me-2 h-4 w-4" /> Add vehicle</Button></div>
        <div className="mt-5 space-y-6">
          {value.vehicles.map((vehicle, index) => (
            <div key={index} className="space-y-4">
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between"><h3 className="font-semibold">Vehicle {index + 1}</h3>{value.vehicles.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => update((draft) => { draft.vehicles.splice(index, 1); })}><Trash2 className="me-2 h-4 w-4" /> Remove</Button>}</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <Field label="Year" htmlFor={`vehicle-${index}-year`}><Input id={`vehicle-${index}-year`} type="number" inputMode="numeric" min="1980" max="2100" required value={vehicle.year} onChange={(event) => updateVehicle(index, { year: Number(event.target.value) })} /></Field>
                <Field label="Make" htmlFor={`vehicle-${index}-make`}><Input id={`vehicle-${index}-make`} required value={vehicle.make} onChange={(event) => updateVehicle(index, { make: event.target.value })} /></Field>
                <div className="space-y-1.5 lg:col-span-2"><Label htmlFor={`vehicle-${index}-model`}>Model</Label><Input id={`vehicle-${index}-model`} required value={vehicle.model} onChange={(event) => updateVehicle(index, { model: event.target.value })} /></div>
                <Field label="Mileage" htmlFor={`vehicle-${index}-mileage`}><Input id={`vehicle-${index}-mileage`} type="number" inputMode="numeric" min="0" required value={vehicle.mileage} onChange={(event) => updateVehicle(index, { mileage: Number(event.target.value) })} /></Field>
                <Field label="License plate" htmlFor={`vehicle-${index}-plate`}><Input id={`vehicle-${index}-plate`} value={vehicle.licensePlate ?? ""} onChange={(event) => updateVehicle(index, { licensePlate: event.target.value })} /></Field>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3"><Label htmlFor={`vehicle-${index}-vin`}>VIN</Label><Input id={`vehicle-${index}-vin`} dir="ltr" autoCapitalize="characters" minLength={17} maxLength={17} required value={vehicle.vin} onChange={(event) => updateVehicle(index, { vin: event.target.value.toUpperCase() })} /></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </fieldset>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
