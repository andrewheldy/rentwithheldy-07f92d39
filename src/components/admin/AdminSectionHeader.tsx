import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSignature, Inbox, Images } from "lucide-react";

export function AdminSectionHeader({ title }: { title: string }) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center gap-2 border-b-2 px-2 text-sm font-semibold ${isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`;
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="me-2 h-4 w-4" /> Site</Link></Button>
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <nav aria-label="Admin sections" className="flex items-center gap-3">
          <NavLink to="/admin/agreements" className={navClass}><FileSignature className="h-4 w-4" /> Agreements</NavLink>
          <NavLink to="/admin/leads" className={navClass}><Inbox className="h-4 w-4" /> Leads</NavLink>
          <NavLink to="/admin/photos" className={navClass}><Images className="h-4 w-4" /> Photos</NavLink>
        </nav>
      </div>
    </header>
  );
}
