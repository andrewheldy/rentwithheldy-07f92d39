import type { ResolvedAgreementDocument } from "@/lib/agreements/types";
import { cadenceLabel } from "@/lib/agreements/render";
import { CheckCircle2, Clock3 } from "lucide-react";

type LiveSignature = {
  id: string;
  name: string;
  role: string;
  status: "pending" | "signed" | "declined";
  signedAt: string | null;
  signatureMethod?: "drawn" | "typed" | null;
  typedSignature?: string | null;
};

const longDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );

export function AgreementDocument({
  document,
  signatures,
  showSummary = true,
}: {
  document: ResolvedAgreementDocument;
  signatures?: LiveSignature[];
  showSummary?: boolean;
}) {
  return (
    <article className="agreement-document mx-auto w-full max-w-4xl bg-white text-[hsl(var(--ink))] sm:border sm:border-border sm:shadow-sm">
      <header className="border-b border-border px-5 py-8 sm:px-10 sm:py-10">
        <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <span>{document.agreementNumber}</span>
          <span className="h-px flex-1 bg-primary" aria-hidden="true" />
          <span>Version {document.agreementVersion}</span>
        </div>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">{document.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">Effective {longDate(document.effectiveDate)}</p>
      </header>

      {showSummary && (
        <section aria-labelledby="agreement-summary" className="border-b border-border bg-secondary/45 px-5 py-7 sm:px-10">
          <h2 id="agreement-summary" className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">Key terms</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trial period</dt>
              <dd className="mt-1 text-sm font-semibold">{longDate(document.summary.trialStartDate)} – {longDate(document.summary.trialReviewDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue split</dt>
              <dd className="mt-1 text-sm font-semibold">{document.summary.operatorPercent}% Rent With Heldy<br />{document.summary.ownerPercent}% Vehicle Owners</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vehicles</dt>
              <dd className="mt-1 text-sm font-semibold">{document.summary.vehicles.map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`).join(" · ")}</dd>
            </div>
          </dl>
        </section>
      )}

      <div className="px-5 py-8 sm:px-10 sm:py-10">
        <p className="mb-10 text-[0.98rem] leading-7 text-[hsl(var(--foreground))]">{document.preamble}</p>
        <section aria-labelledby="parties-heading" className="mb-10">
          <h2 id="parties-heading" className="text-lg font-semibold">Parties</h2>
          <div className="mt-4 grid gap-6 border-s-2 border-primary ps-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Operator</p>
              <p className="mt-1 font-semibold">{document.operator.legalName} d/b/a {document.operator.tradeName}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{document.operator.address}<br />{document.operator.phone}<br />{document.operator.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Vehicle owner{document.owners.length === 1 ? "" : "s"}</p>
              {document.owners.map((owner) => (
                <div key={`${owner.email}-${owner.fullName}`} className="mt-1 first:mt-1 [&+&]:mt-4">
                  <p className="font-semibold">{owner.fullName}</p>
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{owner.address ? `${owner.address}\n` : ""}{owner.phone}<br />{owner.email}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-9">
          {document.sections.map((section) => (
            <section key={section.number} aria-labelledby={`agreement-section-${section.number}`}>
              <h2 id={`agreement-section-${section.number}`} className="border-t border-border pt-5 text-lg font-semibold">
                <span className="me-2 text-primary">{section.number}.</span>{section.title}
              </h2>
              <div className="mt-4 space-y-4 text-[0.98rem] leading-7 text-[hsl(var(--foreground))]">
                {section.blocks.map((block, index) => {
                  if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
                  if (block.type === "vehicles") return (
                    <div key={index} className="space-y-4">
                      {block.vehicles.map((vehicle, vehicleIndex) => (
                        <dl key={vehicle.vin} className="grid gap-x-6 gap-y-1 border-s-2 border-border ps-4 text-sm sm:grid-cols-2">
                          <div className="sm:col-span-2"><dt className="sr-only">Vehicle</dt><dd className="font-semibold">Vehicle {vehicleIndex + 1}: {vehicle.year} {vehicle.make} {vehicle.model}</dd></div>
                          <div><dt className="inline text-muted-foreground">VIN: </dt><dd className="inline font-medium" dir="ltr">{vehicle.vin}</dd></div>
                          <div><dt className="inline text-muted-foreground">Mileage: </dt><dd className="inline font-medium">{vehicle.mileage.toLocaleString("en-US")}</dd></div>
                          <div><dt className="inline text-muted-foreground">License plate: </dt><dd className="inline font-medium">{vehicle.licensePlate || "Not provided"}</dd></div>
                        </dl>
                      ))}
                    </div>
                  );
                  if (block.type === "revenue_split") return <p key={index} className="border-s-2 border-primary ps-4 font-semibold">Rent With Heldy: {block.operatorPercent}%<br />Vehicle Owners: {block.ownerPercent}%</p>;
                  if (block.type === "payment_schedule") return <p key={index}><strong>Payment schedule:</strong> {cadenceLabel(block.cadence)}.</p>;
                  if (block.type === "trial_period") return <p key={index} className="border-s-2 border-primary ps-4 font-semibold">Start date: {longDate(block.startDate)}<br />Review date: {longDate(block.reviewDate)}</p>;
                  if (block.type === "signatures") return (
                    <div key={index} className="grid gap-4 sm:grid-cols-2">
                      {(signatures ?? block.signers.map((signer) => ({ id: signer.id ?? signer.email, name: signer.fullName, role: signer.role, status: signer.status ?? "pending", signedAt: signer.signedAt ?? null, signatureMethod: signer.signatureMethod, typedSignature: signer.typedSignature }))).map((signer) => (
                        <div key={signer.id} className="border-t-2 border-foreground/70 pt-3">
                          {signer.signatureMethod === "typed" && signer.typedSignature && <p className="mb-2 text-xl italic">{signer.typedSignature}</p>}
                          <p className="font-semibold">{signer.name}</p>
                          <p className="text-sm text-muted-foreground">{signer.role}</p>
                          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                            {signer.status === "signed" ? <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <Clock3 className="h-4 w-4 text-amber-700" aria-hidden="true" />}
                            {signer.status === "signed" && signer.signedAt ? `Signed ${new Date(signer.signedAt).toLocaleString("en-US")}` : "Pending signature"}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                  return null;
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
