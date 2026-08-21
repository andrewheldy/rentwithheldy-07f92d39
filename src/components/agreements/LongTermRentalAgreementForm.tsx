import { addDays, addMonths, addYears, format, parseISO } from "date-fns";
import { AgreementDateField } from "@/components/agreements/AgreementDateField";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AgreementData, LongTermRentalAgreementData } from "@/lib/agreements/types";

type Props = {
  value: LongTermRentalAgreementData;
  onChange: (value: AgreementData) => void;
  disabled?: boolean;
};

const today = () => new Date();
const iso = (date: Date) => format(date, "yyyy-MM-dd");
const safeDate = (value: string) => value ? parseISO(value) : today();

export function LongTermRentalAgreementForm({ value, onChange, disabled = false }: Props) {
  const update = (recipe: (draft: LongTermRentalAgreementData) => void) => {
    const draft = structuredClone(value);
    recipe(draft);
    onChange(draft);
  };
  const rentalStart = safeDate(value.rental.startDate);
  const policyStart = safeDate(value.insurance.effectiveDate || value.rental.startDate);

  return (
    <fieldset disabled={disabled} className="space-y-6">
      <legend className="sr-only">Long-term rental agreement details</legend>

      <Card className="p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Agreement setup</p>
          <h2 className="mt-1 text-xl font-semibold">Term and payment</h2>
          <p className="mt-1 text-sm text-muted-foreground">Date shortcuts calculate from the selected start date and remain fully editable.</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AgreementDateField id="rental-effective-date" label="Effective date" required value={value.effectiveDate} onChange={(next) => update((draft) => { draft.effectiveDate = next; })} presets={[{ label: "Today", value: iso(today()) }, { label: "Rental start", value: value.rental.startDate }]} />
          <AgreementDateField id="rental-start-date" label="Rental start date" required value={value.rental.startDate} onChange={(next) => update((draft) => { draft.rental.startDate = next; })} presets={[{ label: "Today", value: iso(today()) }, { label: "+7 days", value: iso(addDays(today(), 7)) }]} />
          <AgreementDateField id="rental-end-date" label="Rental end date" value={value.rental.endDate} onChange={(next) => update((draft) => { draft.rental.endDate = next; })} disabledDates={{ before: addDays(rentalStart, 1) }} presets={[{ label: "30 days", value: iso(addDays(rentalStart, 30)) }, { label: "90 days", value: iso(addDays(rentalStart, 90)) }, { label: "6 months", value: iso(addMonths(rentalStart, 6)) }]} helpText="The agreement calculates the total rental period automatically." />
          <Field label="Weekly rental rate" htmlFor="weekly-rate"><div className="relative"><span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input id="weekly-rate" className="ps-7" type="number" inputMode="decimal" min="0" step="0.01" value={value.rental.weeklyRate ?? ""} onChange={(event) => update((draft) => { draft.rental.weeklyRate = event.target.value === "" ? null : Number(event.target.value); })} /></div></Field>
          <Field label="Monthly rental rate" htmlFor="monthly-rate"><div className="relative"><span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input id="monthly-rate" className="ps-7" type="number" inputMode="decimal" min="0" step="0.01" value={value.rental.monthlyRate ?? ""} onChange={(event) => update((draft) => { draft.rental.monthlyRate = event.target.value === "" ? null : Number(event.target.value); })} /></div></Field>
          <Field label="Payment due" htmlFor="payment-due"><Input id="payment-due" placeholder="e.g. Every Monday or the 1st of each month" value={value.rental.paymentDue} onChange={(event) => update((draft) => { draft.rental.paymentDue = event.target.value; })} /></Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Renter</h2>
        <p className="mt-1 text-sm text-muted-foreground">These fields populate the agreement and the renter's secure signing invitation.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Full legal name" htmlFor="renter-name"><Input id="renter-name" autoComplete="name" value={value.renter.fullName} onChange={(event) => update((draft) => { draft.renter.fullName = event.target.value; })} /></Field>
          <AgreementDateField id="renter-birth-date" label="Date of birth" value={value.renter.dateOfBirth} onChange={(next) => update((draft) => { draft.renter.dateOfBirth = next; })} fromYear={new Date().getFullYear() - 100} toYear={new Date().getFullYear()} initialMonth={new Date(new Date().getFullYear() - 30, 0, 1)} />
          <Field label="Email" htmlFor="renter-email"><Input id="renter-email" type="email" autoComplete="email" value={value.renter.email} onChange={(event) => update((draft) => { draft.renter.email = event.target.value; })} /></Field>
          <Field label="Phone" htmlFor="renter-phone"><Input id="renter-phone" type="tel" autoComplete="tel" value={value.renter.phone} onChange={(event) => update((draft) => { draft.renter.phone = event.target.value; })} /></Field>
          <Field label="Driver's license number" htmlFor="renter-license"><Input id="renter-license" autoComplete="off" value={value.renter.driversLicenseNumber} onChange={(event) => update((draft) => { draft.renter.driversLicenseNumber = event.target.value; })} /></Field>
          <Field label="License state" htmlFor="renter-license-state"><Input id="renter-license-state" value={value.renter.driversLicenseState} onChange={(event) => update((draft) => { draft.renter.driversLicenseState = event.target.value.toUpperCase(); })} /></Field>
          <AgreementDateField id="renter-license-expiration" label="License expiration" value={value.renter.licenseExpirationDate} onChange={(next) => update((draft) => { draft.renter.licenseExpirationDate = next; })} fromYear={new Date().getFullYear() - 1} toYear={new Date().getFullYear() + 15} presets={[{ label: "+1 year", value: iso(addYears(today(), 1)) }, { label: "+4 years", value: iso(addYears(today(), 4)) }]} />
          <div className="hidden lg:block" aria-hidden="true" />
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="renter-address">Home address</Label><Input id="renter-address" autoComplete="street-address" value={value.renter.address ?? ""} onChange={(event) => update((draft) => { draft.renter.address = event.target.value; })} /></div>
          <Field label="City" htmlFor="renter-city"><Input id="renter-city" autoComplete="address-level2" value={value.renter.city} onChange={(event) => update((draft) => { draft.renter.city = event.target.value; })} /></Field>
          <Field label="State" htmlFor="renter-state"><Input id="renter-state" autoComplete="address-level1" value={value.renter.state} onChange={(event) => update((draft) => { draft.renter.state = event.target.value.toUpperCase(); })} /></Field>
          <Field label="ZIP" htmlFor="renter-zip"><Input id="renter-zip" inputMode="numeric" autoComplete="postal-code" value={value.renter.zip} onChange={(event) => update((draft) => { draft.renter.zip = event.target.value; })} /></Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Vehicle</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Year" htmlFor="rental-vehicle-year"><Input id="rental-vehicle-year" type="number" inputMode="numeric" min="1980" max="2100" value={value.vehicle.year} onChange={(event) => update((draft) => { draft.vehicle.year = Number(event.target.value); })} /></Field>
          <Field label="Make" htmlFor="rental-vehicle-make"><Input id="rental-vehicle-make" value={value.vehicle.make} onChange={(event) => update((draft) => { draft.vehicle.make = event.target.value; })} /></Field>
          <Field label="Model" htmlFor="rental-vehicle-model"><Input id="rental-vehicle-model" value={value.vehicle.model} onChange={(event) => update((draft) => { draft.vehicle.model = event.target.value; })} /></Field>
          <Field label="Color" htmlFor="rental-vehicle-color"><Input id="rental-vehicle-color" value={value.vehicle.color} onChange={(event) => update((draft) => { draft.vehicle.color = event.target.value; })} /></Field>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="rental-vehicle-vin">VIN</Label><Input id="rental-vehicle-vin" dir="ltr" autoCapitalize="characters" minLength={17} maxLength={17} value={value.vehicle.vin} onChange={(event) => update((draft) => { draft.vehicle.vin = event.target.value.toUpperCase(); })} /></div>
          <Field label="License plate" htmlFor="rental-vehicle-plate"><Input id="rental-vehicle-plate" value={value.vehicle.licensePlate ?? ""} onChange={(event) => update((draft) => { draft.vehicle.licensePlate = event.target.value; })} /></Field>
          <Field label="Starting mileage" htmlFor="rental-vehicle-mileage"><Input id="rental-vehicle-mileage" type="number" inputMode="numeric" min="0" value={value.vehicle.mileage} onChange={(event) => update((draft) => { draft.vehicle.mileage = Number(event.target.value); })} /></Field>
          <Field label="Fuel level at delivery" htmlFor="rental-vehicle-fuel"><Input id="rental-vehicle-fuel" placeholder="e.g. Full" value={value.vehicle.fuelLevel} onChange={(event) => update((draft) => { draft.vehicle.fuelLevel = event.target.value; })} /></Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Insurance</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="insurance-arrangement">Insurance arrangement</Label><Select value={value.insurance.arrangement || undefined} onValueChange={(next: "renter_provided" | "separately_arranged") => update((draft) => { draft.insurance.arrangement = next; })}><SelectTrigger id="insurance-arrangement"><SelectValue placeholder="Choose arrangement" /></SelectTrigger><SelectContent><SelectItem value="renter_provided">Renter provides insurance</SelectItem><SelectItem value="separately_arranged">Arranged separately</SelectItem></SelectContent></Select></div>
          <Field label="Insurance company" htmlFor="insurance-company"><Input id="insurance-company" value={value.insurance.company} onChange={(event) => update((draft) => { draft.insurance.company = event.target.value; })} /></Field>
          <Field label="Policyholder name" htmlFor="policyholder-name"><Input id="policyholder-name" value={value.insurance.policyholderName} onChange={(event) => update((draft) => { draft.insurance.policyholderName = event.target.value; })} /></Field>
          <Field label="Policy number" htmlFor="policy-number"><Input id="policy-number" value={value.insurance.policyNumber} onChange={(event) => update((draft) => { draft.insurance.policyNumber = event.target.value; })} /></Field>
          <AgreementDateField id="policy-effective-date" label="Policy effective date" value={value.insurance.effectiveDate} onChange={(next) => update((draft) => { draft.insurance.effectiveDate = next; })} presets={[{ label: "Rental start", value: value.rental.startDate }, { label: "Today", value: iso(today()) }]} />
          <AgreementDateField id="policy-expiration-date" label="Policy expiration date" value={value.insurance.expirationDate} onChange={(next) => update((draft) => { draft.insurance.expirationDate = next; })} disabledDates={{ before: addDays(policyStart, 1) }} presets={[{ label: "+6 months", value: iso(addMonths(policyStart, 6)) }, { label: "+1 year", value: iso(addYears(policyStart, 1)) }]} />
          <Field label="Agent / insurance phone" htmlFor="insurance-phone"><Input id="insurance-phone" type="tel" value={value.insurance.agentPhone} onChange={(event) => update((draft) => { draft.insurance.agentPhone = event.target.value; })} /></Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Use, maintenance, and return</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Additional authorized driver" htmlFor="additional-driver"><Input id="additional-driver" value={value.additionalDriver.fullName} onChange={(event) => update((draft) => { draft.additionalDriver.fullName = event.target.value; })} /></Field>
          <Field label="Additional driver's license number" htmlFor="additional-driver-license"><Input id="additional-driver-license" value={value.additionalDriver.driversLicenseNumber} onChange={(event) => update((draft) => { draft.additionalDriver.driversLicenseNumber = event.target.value; })} /></Field>
          <div className="space-y-1.5"><Label htmlFor="rideshare-use">Rideshare / delivery use</Label><Select value={value.rideshareUse || undefined} onValueChange={(next: LongTermRentalAgreementData["rideshareUse"]) => update((draft) => { draft.rideshareUse = next; })}><SelectTrigger id="rideshare-use"><SelectValue placeholder="Choose permission" /></SelectTrigger><SelectContent><SelectItem value="permitted">Permitted</SelectItem><SelectItem value="not_permitted">Not permitted</SelectItem><SelectItem value="prior_approval">Prior written approval required</SelectItem></SelectContent></Select></div>
          <Field label="Agreed return location" htmlFor="return-location"><Input id="return-location" value={value.returnLocation} onChange={(event) => update((draft) => { draft.returnLocation = event.target.value; })} /></Field>
          <Field label="Routine maintenance responsibility" htmlFor="maintenance-routine"><Input id="maintenance-routine" value={value.maintenance.routine} onChange={(event) => update((draft) => { draft.maintenance.routine = event.target.value; })} /></Field>
          <Field label="Oil changes" htmlFor="maintenance-oil"><Input id="maintenance-oil" value={value.maintenance.oilChanges} onChange={(event) => update((draft) => { draft.maintenance.oilChanges = event.target.value; })} /></Field>
          <Field label="Tires" htmlFor="maintenance-tires"><Input id="maintenance-tires" value={value.maintenance.tires} onChange={(event) => update((draft) => { draft.maintenance.tires = event.target.value; })} /></Field>
          <Field label="Mechanical repairs" htmlFor="maintenance-repairs"><Input id="maintenance-repairs" value={value.maintenance.mechanicalRepairs} onChange={(event) => update((draft) => { draft.maintenance.mechanicalRepairs = event.target.value; })} /></Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Vehicle condition at delivery</h2>
        <p className="mt-1 text-sm text-muted-foreground">This delivery record becomes part of the frozen agreement.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="condition-exterior">Exterior condition / existing damage</Label><Textarea id="condition-exterior" rows={3} value={value.condition.exterior} onChange={(event) => update((draft) => { draft.condition.exterior = event.target.value; })} /></div>
          <div className="space-y-1.5"><Label htmlFor="condition-interior">Interior condition</Label><Textarea id="condition-interior" rows={3} value={value.condition.interior} onChange={(event) => update((draft) => { draft.condition.interior = event.target.value; })} /></div>
          <div className="space-y-1.5"><Label htmlFor="condition-mechanical">Warning lights / mechanical issues</Label><Textarea id="condition-mechanical" rows={3} value={value.condition.mechanical} onChange={(event) => update((draft) => { draft.condition.mechanical = event.target.value; })} /></div>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium"><Checkbox checked={value.condition.photosTaken} onCheckedChange={(checked) => update((draft) => { draft.condition.photosTaken = checked === true; })} /> Photos taken at delivery</label>
          <Field label="Number of keys provided" htmlFor="keys-provided"><Input id="keys-provided" type="number" inputMode="numeric" min="0" max="20" value={value.condition.keysProvided} onChange={(event) => update((draft) => { draft.condition.keysProvided = Number(event.target.value); })} /></Field>
          <Field label="Renter initials" htmlFor="renter-initials"><Input id="renter-initials" maxLength={20} value={value.condition.renterInitials} onChange={(event) => update((draft) => { draft.condition.renterInitials = event.target.value; })} /></Field>
          <AgreementDateField id="vehicle-acceptance-date" label="Vehicle acceptance date" value={value.condition.acceptanceDate} onChange={(next) => update((draft) => { draft.condition.acceptanceDate = next; })} presets={[{ label: "Rental start", value: value.rental.startDate }, { label: "Today", value: iso(today()) }]} />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Rent With Heldy representative</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name" htmlFor="rental-operator-name"><Input id="rental-operator-name" autoComplete="name" value={value.operator.signer.fullName} onChange={(event) => update((draft) => { draft.operator.signer.fullName = event.target.value; })} /></Field>
          <Field label="Email" htmlFor="rental-operator-email"><Input id="rental-operator-email" type="email" autoComplete="email" value={value.operator.signer.email} onChange={(event) => update((draft) => { draft.operator.signer.email = event.target.value; })} /></Field>
          <Field label="Phone" htmlFor="rental-operator-phone"><Input id="rental-operator-phone" type="tel" autoComplete="tel" value={value.operator.signer.phone} onChange={(event) => update((draft) => { draft.operator.signer.phone = event.target.value; })} /></Field>
        </div>
      </Card>
    </fieldset>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
