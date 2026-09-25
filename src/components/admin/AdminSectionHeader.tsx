import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Title bar at the top of each admin page, inside <AdminLayout>. */
export function AdminSectionHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="h-11 w-11 shrink-0" aria-label="Toggle admin menu" />
          <span className="h-6 w-px bg-border" aria-hidden="true" />
          <h1 className="truncate text-xl font-semibold">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
