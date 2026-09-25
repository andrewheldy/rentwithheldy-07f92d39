import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Car, ExternalLink, FilePlus2, FileSignature, Images, Inbox, LogOut, Newspaper, Settings, UsersRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Extra paths (prefixes) that belong to this item, e.g. detail pages. */
  matches?: (pathname: string) => boolean;
};

type AdminNavGroup = { label: string; items: AdminNavItem[] };

const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Owners",
    items: [{ label: "Consigners", to: "/admin/consigners", icon: UsersRound }],
  },
  {
    label: "Content",
    items: [
      {
        label: "Blog posts",
        to: "/admin/blog",
        icon: Newspaper,
        matches: (pathname) => pathname.startsWith("/admin/blog") && pathname !== "/admin/blog/new",
      },
      { label: "New post", to: "/admin/blog/new", icon: FilePlus2 },
      { label: "Photos", to: "/admin/photos", icon: Images },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Leads", to: "/admin/leads", icon: Inbox },
      {
        label: "Agreements",
        to: "/admin/agreements",
        icon: FileSignature,
        matches: (pathname) => pathname.startsWith("/admin/agreements"),
      },
      { label: "Vehicles", to: "/addcars", icon: Car },
    ],
  },
];

// Collapsed to icons: labels stay available to screen readers.
const collapsedLabel = "group-data-[collapsible=icon]:sr-only";

const isItemActive = (item: AdminNavItem, pathname: string) =>
  item.matches ? item.matches(pathname) : pathname === item.to;

export function AdminSidebar({ side }: { side: "left" | "right" }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  // The mobile sidebar is a sheet; close it once a link has navigated.
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, pathname, setOpenMobile]);

  return (
    <Sidebar side={side} collapsible="icon" aria-label="Admin">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to="/admin/consigners"
          className="flex min-h-11 items-center gap-2 rounded-md px-2 outline-none ring-sidebar-ring focus-visible:ring-2"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-heading text-sm font-bold text-sidebar-primary-foreground"
            aria-hidden="true"
          >
            RH
          </span>
          <span className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="block truncate font-heading text-base font-semibold">Rent With Heldy</span>
            <span className="block text-xs text-sidebar-foreground/70">Admin</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Admin sections">
          {adminNavGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-sidebar-foreground/70">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isItemActive(item, pathname);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="h-10">
                          <Link to={item.to} aria-current={active ? "page" : undefined}>
                            <item.icon aria-hidden="true" />
                            <span className={collapsedLabel}>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin/settings"} tooltip="Account settings" className="h-10">
              <Link to="/admin/settings" aria-current={pathname === "/admin/settings" ? "page" : undefined}>
                <Settings aria-hidden="true" />
                <span className={collapsedLabel}>Account settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="View website" className="h-10">
              <Link to="/">
                <ExternalLink aria-hidden="true" />
                <span className={collapsedLabel}>View website</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" className="h-10" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" />
              <span className={collapsedLabel}>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {user?.email && (
          <p className="truncate px-2 pb-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden" dir="ltr">
            {user.email}
          </p>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
