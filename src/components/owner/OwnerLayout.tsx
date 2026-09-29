import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BarChart3, Car, ChevronDown, ExternalLink, FileText, Loader2, LogOut, Settings, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LanguageSelector from "@/components/LanguageSelector";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getDirection } from "@/i18n/direction";
import { NotAnOwnerError } from "@/lib/owner/api";
import logo from "@/assets/rent-with-heldy-logo.png";
import { OwnerDashboardProvider, useOwnerDashboard } from "./OwnerContext";

type NavItem = { key: "analytics" | "vehicle" | "documents"; path: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { key: "analytics", path: "/owner", icon: BarChart3 },
  { key: "vehicle", path: "/owner/vehicle", icon: Car },
  { key: "documents", path: "/owner/documents", icon: FileText },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function OwnerNotLinked() {
  const { t } = useTranslation("owner");
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO title={t("meta.title")} description={t("meta.description")} path="/owner" noIndex />
      <Header />
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-16">
        <Card className="max-w-lg p-8 text-center">
          <Car className="mx-auto h-10 w-10 text-primary-text" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">{t("notLinked.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("notLinked.body")}</p>
          <Button asChild className="mt-6">
            <Link to="/contact">{t("notLinked.contact")}</Link>
          </Button>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function OwnerSidebar({ side }: { side: "left" | "right" }) {
  const { t } = useTranslation("owner");
  const { pathname } = useLocation();
  const { ownerPath } = useOwnerDashboard();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, pathname, setOpenMobile]);

  return (
    <Sidebar side={side} collapsible="offcanvas" aria-label={t("nav.label")}>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to={ownerPath("/owner")} className="flex min-h-11 items-center gap-2.5 rounded-md px-2 outline-none ring-sidebar-ring focus-visible:ring-2">
          <img src={logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-heading text-base font-bold">Rent With Heldy</span>
            <span className="block text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/70">{t("tagline")}</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={t("nav.label")}>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => {
                  const active = pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild isActive={active} className="h-11 text-[15px]">
                        <Link to={ownerPath(item.path)} aria-current={active ? "page" : undefined}>
                          <item.icon aria-hidden="true" />
                          <span>{t(`nav.${item.key}`)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}

function AccountMenu() {
  const { t } = useTranslation("owner");
  const { signOut } = useAuth();
  const { data, ownerPath, previewConsignerId } = useOwnerDashboard();
  const name = data?.consigner.legal_name ?? "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-12 gap-3 px-2" aria-label={t("nav.account")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-ink-foreground" aria-hidden="true">
            {initials(name) || "RH"}
          </span>
          <span className="hidden min-w-0 text-start leading-tight sm:block">
            <span className="block max-w-40 truncate text-sm font-semibold">{name}</span>
            <span className="block text-xs font-normal text-muted-foreground">{t("role")}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!previewConsignerId && (
          <DropdownMenuItem asChild>
            <Link to={ownerPath("/owner/settings")}>
              <Settings className="me-2 h-4 w-4" aria-hidden="true" /> {t("nav.settings")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/">
            <ExternalLink className="me-2 h-4 w-4" aria-hidden="true" /> {t("nav.website")}
          </Link>
        </DropdownMenuItem>
        {!previewConsignerId && (
          <DropdownMenuItem onSelect={() => void signOut()}>
            <LogOut className="me-2 h-4 w-4" aria-hidden="true" /> {t("nav.signOut")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OwnerShell() {
  const { t, i18n } = useTranslation("owner");
  const side = getDirection(i18n.language) === "rtl" ? "right" : "left";
  const { data, isLoading, error, refetch, previewConsignerId } = useOwnerDashboard();

  let body: JSX.Element;
  if (isLoading) {
    body = (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-muted-foreground" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {t("loading")}
      </div>
    );
  } else if (error instanceof NotAnOwnerError) {
    body = (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="max-w-lg p-8 text-center">
          <Car className="mx-auto h-10 w-10 text-primary-text" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">{t("notLinked.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("notLinked.body")}</p>
          <Button asChild className="mt-6">
            <Link to="/contact">{t("notLinked.contact")}</Link>
          </Button>
        </Card>
      </div>
    );
  } else if (error || !data) {
    body = (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="max-w-lg p-8 text-center" role="alert">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">{t("error.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("error.body")}</p>
          <Button className="mt-6" onClick={refetch}>
            {t("error.retry")}
          </Button>
        </Card>
      </div>
    );
  } else {
    body = <Outlet />;
  }

  return (
    <SidebarProvider>
      <SEO title={t("meta.title")} description={t("meta.description")} path="/owner" noIndex />
      <OwnerSidebar side={side} />
      <div className="relative flex min-h-svh min-w-0 flex-1 flex-col bg-background">
        {previewConsignerId && data && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950 sm:px-6">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("preview.banner", { name: data.consigner.legal_name })}
            </span>
            <Link to="/admin/consigners" className="font-semibold underline underline-offset-2">
              {t("preview.back")}
            </Link>
          </div>
        )}
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-6">
          <SidebarTrigger className="h-11 w-11 shrink-0" aria-label={t("nav.toggle")} />
          <div className="flex items-center gap-1 sm:gap-3">
            <LanguageSelector />
            {data && <AccountMenu />}
          </div>
        </header>
        {body}
      </div>
    </SidebarProvider>
  );
}

/**
 * /owner/*: the consigner's own dashboard. Admins may open it with
 * ?as=<consigner id> to see exactly what that owner sees.
 */
export function OwnerLayout() {
  const { user, isAdmin, isConsigner, isLoading, rolesLoaded } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const previewId = params.get("as");

  if (isLoading || !rolesLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (isAdmin && !previewId) return <Navigate to="/admin/consigners" replace />;
  if (!isAdmin && !isConsigner) return <OwnerNotLinked />;

  return (
    <OwnerDashboardProvider previewConsignerId={isAdmin ? previewId : null}>
      <OwnerShell />
    </OwnerDashboardProvider>
  );
}
