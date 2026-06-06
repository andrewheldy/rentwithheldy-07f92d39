import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, Trash2, Star, StarOff, AlertCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
  current_mileage: number | null;
  last_oil_change_date: string | null;
  delivery_fee_port_miami: number | null;
  delivery_fee_port_everglades: number | null;
  delivery_fee_mia_airport: number | null;
  delivery_fee_fll_airport: number | null;
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

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const isPlaceholder = (url: string | undefined) =>
  !url ||
  url.endsWith(".svg") ||
  url.includes("/__l5e/assets-v1/") ||
  url.includes("/placeholder");

export const VehicleEditDialog = ({ vehicle, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminVehicle | null>(vehicle);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(vehicle);
  }, [vehicle]);

  const { data: images, refetch: refetchImages } = useQuery({
    queryKey: ["admin-vehicle-images", vehicle?.id],
    enabled: !!vehicle?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_images")
        .select("id, image_url, is_primary")
        .eq("vehicle_id", vehicle!.id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

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
          current_mileage: v.current_mileage,
          last_oil_change_date: v.last_oil_change_date,
          delivery_fee_port_miami: v.delivery_fee_port_miami,
          delivery_fee_port_everglades: v.delivery_fee_port_everglades,
          delivery_fee_mia_airport: v.delivery_fee_mia_airport,
          delivery_fee_fll_airport: v.delivery_fee_fll_airport,
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
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const handleUpload = async (file: File) => {
    if (!form) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `vehicles/${form.id}/${Date.now()}_${slug(
        `${form.year}-${form.make}-${form.model}`
      )}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vehicle-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("vehicle-images").getPublicUrl(path);

      const hasRealPrimary = (images ?? []).some(
        (i) => i.is_primary && !isPlaceholder(i.image_url)
      );
      // Remove placeholder primaries so this becomes primary cleanly
      const placeholders = (images ?? []).filter(
        (i) => i.is_primary && isPlaceholder(i.image_url)
      );
      if (placeholders.length) {
        await supabase
          .from("vehicle_images")
          .delete()
          .in("id", placeholders.map((p) => p.id));
      }

      const { error: insErr } = await supabase.from("vehicle_images").insert({
        vehicle_id: form.id,
        image_url: pub.publicUrl,
        is_primary: !hasRealPrimary,
      });
      if (insErr) throw insErr;

      toast({ title: "Photo uploaded" });
      refetchImages();
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase.from("vehicle_images").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    refetchImages();
    queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const makePrimary = async (id: string) => {
    if (!form) return;
    await supabase
      .from("vehicle_images")
      .update({ is_primary: false })
      .eq("vehicle_id", form.id);
    const { error } = await supabase
      .from("vehicle_images")
      .update({ is_primary: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    refetchImages();
    queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  };

  if (!form) return null;

  const update = <K extends keyof AdminVehicle>(key: K, value: AdminVehicle[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {form.year} {form.make} {form.model}
          </DialogTitle>
          <DialogDescription>
            Manage pricing, maintenance, delivery fees, and photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input id="make" value={form.make} onChange={(e) => update("make", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={form.model} onChange={(e) => update("model", e.target.value)} />
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
              <Input id="color" value={form.color} onChange={(e) => update("color", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                placeholder="available, maintenance, rented"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Pricing (visible on website)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="daily_rate">Daily Rate ($)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={form.daily_rate}
                  onChange={(e) => update("daily_rate", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="weekday_rate">Weekday Rate ($)</Label>
                <Input
                  id="weekday_rate"
                  type="number"
                  value={form.weekday_rate ?? ""}
                  onChange={(e) => update("weekday_rate", numericOrNull(e.target.value))}
                  placeholder="Mon–Thu"
                />
              </div>
              <div>
                <Label htmlFor="weekend_rate">Weekend Rate ($)</Label>
                <Input
                  id="weekend_rate"
                  type="number"
                  value={form.weekend_rate ?? ""}
                  onChange={(e) => update("weekend_rate", numericOrNull(e.target.value))}
                  placeholder="Fri–Sun"
                />
              </div>
            </div>
          </div>

          {/* Delivery fees */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Delivery Fees ($)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="del_pom">Port of Miami</Label>
                <Input
                  id="del_pom"
                  type="number"
                  value={form.delivery_fee_port_miami ?? ""}
                  onChange={(e) =>
                    update("delivery_fee_port_miami", numericOrNull(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="del_pev">Port Everglades</Label>
                <Input
                  id="del_pev"
                  type="number"
                  value={form.delivery_fee_port_everglades ?? ""}
                  onChange={(e) =>
                    update("delivery_fee_port_everglades", numericOrNull(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="del_mia">Miami Airport (MIA)</Label>
                <Input
                  id="del_mia"
                  type="number"
                  value={form.delivery_fee_mia_airport ?? ""}
                  onChange={(e) =>
                    update("delivery_fee_mia_airport", numericOrNull(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="del_fll">Fort Lauderdale Airport (FLL)</Label>
                <Input
                  id="del_fll"
                  type="number"
                  value={form.delivery_fee_fll_airport ?? ""}
                  onChange={(e) =>
                    update("delivery_fee_fll_airport", numericOrNull(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Maintenance</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="current_mileage">Current Mileage</Label>
                <Input
                  id="current_mileage"
                  type="number"
                  value={form.current_mileage ?? ""}
                  onChange={(e) => update("current_mileage", numericOrNull(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="initial_mileage">Initial Mileage</Label>
                <Input
                  id="initial_mileage"
                  type="number"
                  value={form.initial_mileage ?? ""}
                  onChange={(e) => update("initial_mileage", numericOrNull(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="oil">Last Oil Change</Label>
                <Input
                  id="oil"
                  type="date"
                  value={form.last_oil_change_date ?? ""}
                  onChange={(e) =>
                    update("last_oil_change_date", e.target.value || null)
                  }
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Photos</p>
              <div>
                <input
                  id={`vphoto-${form.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <label htmlFor={`vphoto-${form.id}`}>
                  <Button asChild size="sm" disabled={uploading}>
                    <span className="cursor-pointer">
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload photo
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            {(images?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> No photos yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images!.map((img) => {
                  const placeholder = isPlaceholder(img.image_url);
                  return (
                    <div
                      key={img.id}
                      className="relative group rounded-md overflow-hidden border bg-muted"
                    >
                      <img
                        src={img.image_url}
                        alt=""
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute top-1 left-1 flex gap-1">
                        {img.is_primary && (
                          <Badge className="text-[10px] h-5">Primary</Badge>
                        )}
                        {placeholder && (
                          <Badge variant="destructive" className="text-[10px] h-5">
                            Placeholder
                          </Badge>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {!img.is_primary && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => makePrimary(img.id)}
                          >
                            <Star className="h-3.5 w-3.5 mr-1" /> Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteImage(img.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
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
                  onChange={(e) => update("license_plate", e.target.value || null)}
                />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
