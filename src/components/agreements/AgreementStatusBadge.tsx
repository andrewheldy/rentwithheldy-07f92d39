import { Badge } from "@/components/ui/badge";
import type { AgreementStatus } from "@/lib/agreements/types";
import { CheckCircle2, CircleDashed, Clock3, FilePenLine, Ban, CalendarX2 } from "lucide-react";

const config: Record<AgreementStatus, { label: string; className: string; icon: typeof Clock3 }> = {
  draft: { label: "Draft", className: "border-border bg-muted text-foreground", icon: FilePenLine },
  sent: { label: "Awaiting signatures", className: "border-amber-300 bg-amber-50 text-amber-900", icon: Clock3 },
  partially_signed: { label: "Partially signed", className: "border-sky-300 bg-sky-50 text-sky-900", icon: CircleDashed },
  executed: { label: "Executed", className: "border-emerald-300 bg-emerald-50 text-emerald-900", icon: CheckCircle2 },
  voided: { label: "Voided", className: "border-rose-300 bg-rose-50 text-rose-900", icon: Ban },
  expired: { label: "Expired", className: "border-slate-300 bg-slate-50 text-slate-800", icon: CalendarX2 },
};

export function AgreementStatusBadge({ status }: { status: AgreementStatus }) {
  const item = config[status];
  const Icon = item.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 whitespace-nowrap font-medium ${item.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {item.label}
    </Badge>
  );
}
