import { CalendarClock, CheckCircle2, FilePenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BlogStatus } from "@/lib/blog/types";

const config: Record<BlogStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", className: "border-border bg-muted text-foreground", icon: FilePenLine },
  scheduled: { label: "Scheduled", className: "border-sky-300 bg-sky-50 text-sky-900", icon: CalendarClock },
  published: { label: "Published", className: "border-emerald-300 bg-emerald-50 text-emerald-900", icon: CheckCircle2 },
};

export function BlogStatusBadge({ status }: { status: BlogStatus }) {
  const item = config[status];
  const Icon = item.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 whitespace-nowrap font-medium ${item.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {item.label}
    </Badge>
  );
}
