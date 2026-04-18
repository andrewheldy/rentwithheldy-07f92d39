import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export interface AdminVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  daily_rate: number;
  weekday_rate: number | null;
  weekend_rate: number | null;
  description: string;
  features: string[] | null;
  vin: string | null;
  license_plate: string | null;
  initial_mileage: number | null;
  status: string;
  location: string | null;
}

interface Props {
  vehicle: AdminVehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const numericOrNull = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const VehicleEditDialog = ({ vehicle, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminVehicle | null>(vehicle);

  useEffect(() => {
    setForm(vehicle);
  }, [vehicle]);

  const mutation = useMutation({
    mutationFn: async (v: AdminVehicle) => {
      const { error } = await supabase
        .from("vehicles")
        .update({
          make: v.make,
          model: v.model,
          year: v.year,
          color: v.color,
          daily_rate: v.daily_rate,
          weekday_rate: v.weekday_rate,
          weekend_rate: v.weekend_rate,
          description: v.description,
          features: v.features ?? [],
          vin: v.vin,
          license_plate: v.license_plate,
          initial_mileage: v.initial_mileage,
          status: v.status,
          location: v.location,
        })
        .eq("id", v.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: "Vehicle updated" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (!form) return null;

  const update = <K extends keyof AdminVehicle>(key: K, value: AdminVehicle[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {form.year} {form.make} {form.model}
          </DialogTitle>
          <DialogDescription>
            Update vehicle details, pricing, and admin-only information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={form.make}
                onChange={(e) => update("make", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) => update("year", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                placeholder="available, maintenance, retired"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Pricing</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="daily_rate">Daily Rate ($)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={form.daily_rate}
                  onChange={(e) =>
                    update("daily_rate", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="weekday_rate">Weekday Rate ($)</Label>
                <Input
                  id="weekday_rate"
                  type="number"
                  value={form.weekday_rate ?? ""}
                  onChange={(e) =>
                    update("weekday_rate", numericOrNull(e.target.value))
                  }
                  placeholder="Mon–Thu"
                />
              </div>
              <div>
                <Label htmlFor="weekend_rate">Weekend Rate ($)</Label>
                <Input
                  id="weekend_rate"
                  type="number"
                  value={form.weekend_rate ?? ""}
                  onChange={(e) =>
                    update("weekend_rate", numericOrNull(e.target.value))
                  }
                  placeholder="Fri–Sun"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Input
              id="features"
              value={(form.features ?? []).join(", ")}
              onChange={(e) =>
                update(
                  "features",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>

          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <p className="text-sm font-medium">Admin-only</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={form.vin ?? ""}
                  onChange={(e) => update("vin", e.target.value || null)}
                />
              </div>
              <div>
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  value={form.license_plate ?? ""}
                  onChange={(e) =>
                    update("license_plate", e.target.value || null)
                  }
                />
              </div>
              <div>
                <Label htmlFor="initial_mileage">Initial Mileage</Label>
                <Input
                  id="initial_mileage"
                  type="number"
                  value={form.initial_mileage ?? ""}
                  onChange={(e) =>
                    update("initial_mileage", numericOrNull(e.target.value))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location ?? ""}
                onChange={(e) => update("location", e.target.value || null)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
