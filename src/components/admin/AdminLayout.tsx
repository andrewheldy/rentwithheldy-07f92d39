import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getDirection } from "@/i18n/direction";

/**
 * Shell for every admin screen: the section sidebar plus the page. Pages
 * render their own <AdminSectionHeader> (title bar with the sidebar toggle)
 * and <main>. Lazy admin pages suspend inside the shell, so the sidebar stays
 * put while they load.
 */
export function AdminLayout() {
  const { i18n } = useTranslation();
  const side = getDirection(i18n.language) === "rtl" ? "right" : "left";

  return (
    <SidebarProvider>
      <AdminSidebar side={side} />
      {/* Not SidebarInset: it renders a <main>, and each page has its own. */}
      <div className="relative flex min-h-svh min-w-0 flex-1 flex-col bg-background">
        <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </div>
    </SidebarProvider>
  );
}
