import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Loader2, ImageOff, ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VehicleEditDialog, AdminVehicle } from "./VehicleEditDialog";

const ADMIN_COLUMNS = `
  id, make, model, year, color, daily_rate, weekday_rate, weekend_rate,
  description, features, vin, license_plate, initial_mileage, current_mileage,
  last_oil_change_date, delivery_fee_port_miami, delivery_fee_port_everglades,
  delivery_fee_mia_airport, delivery_fee_fll_airport,
  status, location,
  vehicle_images ( id, image_url, is_primary )
`;

const isPlaceholder = (url: string | undefined) =>
  !url ||
  url.endsWith(".svg") ||
  url.includes("/__l5e/assets-v1/") ||
  url.includes("/placeholder");

type Row = AdminVehicle & {
  vehicle_images: { id: string; image_url: string; is_primary: boolean }[];
};

export const VehicleManagerList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminVehicle | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminVehicle | null>(null);
  const [filter, setFilter] = useState<"all" | "missing">("all");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["admin-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(ADMIN_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: "Vehicle deleted" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (v: Row) => {
    const { vehicle_images: _vi, ...rest } = v;
    setEditing(rest);
    setEditOpen(true);
  };

  const photoStatus = (v: Row) => {
    const imgs = v.vehicle_images ?? [];
    if (imgs.length === 0) return "none" as const;
    const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
    return isPlaceholder(primary.image_url) ? "placeholder" : "ok";
  };

  const filtered = (vehicles ?? []).filter((v) =>
    filter === "missing" ? photoStatus(v) !== "ok" : true
  );
  const missingCount = (vehicles ?? []).filter((v) => photoStatus(v) !== "ok").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Current Fleet</CardTitle>
            <CardDescription>
              Edit pricing, maintenance, delivery fees, photos, or remove vehicles.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All ({vehicles?.length ?? 0})
            </Button>
            <Button
              size="sm"
              variant={filter === "missing" ? "default" : "outline"}
              onClick={() => setFilter("missing")}
              className={filter === "missing" ? "" : "text-destructive"}
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Needs photo ({missingCount})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {filter === "missing"
              ? "All vehicles have real photos."
              : "No vehicles in the database yet. Add one below."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((v) => {
              const status = photoStatus(v);
              const primary =
                v.vehicle_images?.find((i) => i.is_primary) ?? v.vehicle_images?.[0];
              return (
                <div
                  key={v.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-14 w-20 shrink-0 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                      {primary?.image_url ? (
                        <img
                          src={primary.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">
                          {v.year} {v.make} {v.model}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {v.color}
                        </Badge>
                        {status === "none" && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <ImageOff className="h-3 w-3" /> No photo
                          </Badge>
                        )}
                        {status === "placeholder" && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <ImageIcon className="h-3 w-3" /> Placeholder
                          </Badge>
                        )}
                        {v.status !== "available" && (
                          <Badge variant="outline" className="text-xs">
                            {v.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Daily: ${v.daily_rate}</span>
                        <span>
                          Weekday: {v.weekday_rate != null ? `$${v.weekday_rate}` : "—"}
                        </span>
                        <span>
                          Weekend: {v.weekend_rate != null ? `$${v.weekend_rate}` : "—"}
                        </span>
                        {v.current_mileage != null && (
                          <span>{v.current_mileage.toLocaleString()} mi</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        const { vehicle_images: _vi, ...rest } = v;
                        setDeleteTarget(rest);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <VehicleEditDialog vehicle={editing} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  This will permanently remove{" "}
                  <strong>
                    {deleteTarget.year} {deleteTarget.make} {deleteTarget.model}
                  </strong>{" "}
                  and any associated images. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete vehicle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
