import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type VehicleRow = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  vehicle_images: { id: string; image_url: string; is_primary: boolean }[];
};

const isPlaceholder = (url: string | undefined) =>
  !url ||
  url.endsWith(".svg") ||
  url.includes("/__l5e/assets-v1/") ||
  url.includes("/placeholder");

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminPhotos = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["admin-photos-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, year, make, model, color, vehicle_images(id, image_url, is_primary)")
        .order("year", { ascending: false })
        .order("make");
      if (error) throw error;
      return (data ?? []) as VehicleRow[];
    },
  });

  const handleUpload = async (vehicle: VehicleRow, file: File) => {
    setUploadingId(vehicle.id);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `vehicles/${vehicle.id}/${Date.now()}_${slug(
        `${vehicle.year}-${vehicle.make}-${vehicle.model}`
      )}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("vehicle-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("vehicle-images").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      // Replace primary image: delete old placeholder primary(s), insert new primary
      const primaries = vehicle.vehicle_images.filter((i) => i.is_primary);
      if (primaries.length) {
        const { error: delErr } = await supabase
          .from("vehicle_images")
          .delete()
          .in("id", primaries.map((p) => p.id));
        if (delErr) throw delErr;
      }

      const { error: insErr } = await supabase.from("vehicle_images").insert({
        vehicle_id: vehicle.id,
        image_url: publicUrl,
        is_primary: true,
      });
      if (insErr) throw insErr;

      toast({ title: "Photo uploaded", description: `${vehicle.year} ${vehicle.make} ${vehicle.model}` });
      qc.invalidateQueries({ queryKey: ["admin-photos-vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const renderVehicle = (v: VehicleRow) => {
    const primary = v.vehicle_images.find((i) => i.is_primary) ?? v.vehicle_images[0];
    const placeholder = isPlaceholder(primary?.image_url);
    const uploading = uploadingId === v.id;

    return (
      <Card key={v.id} className="overflow-hidden">
        <div className="aspect-video bg-muted relative">
          {primary?.image_url ? (
            <img
              src={primary.image_url}
              alt={`${v.year} ${v.make} ${v.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            {placeholder ? (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" /> Placeholder
              </Badge>
            ) : (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Real photo
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="font-semibold truncate">
              {v.year} {v.make} {v.model}
            </p>
            <p className="text-xs text-muted-foreground">{v.color}</p>
          </div>
          <div>
            <input
              id={`upload-${v.id}`}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(v, file);
                e.target.value = "";
              }}
            />
            <label htmlFor={`upload-${v.id}`} className="block">
              <Button
                asChild
                size="sm"
                className="w-full cursor-pointer"
                variant={placeholder ? "default" : "outline"}
                disabled={uploading}
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {placeholder ? "Upload real photo" : "Replace photo"}
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>
    );
  };

  const placeholders = (vehicles ?? []).filter((v) =>
    isPlaceholder(v.vehicle_images.find((i) => i.is_primary)?.image_url ?? v.vehicle_images[0]?.image_url)
  );
  const real = (vehicles ?? []).filter(
    (v) => !isPlaceholder(v.vehicle_images.find((i) => i.is_primary)?.image_url ?? v.vehicle_images[0]?.image_url)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ImageIcon className="h-8 w-8 text-primary" />
              Vehicle Photos
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload real photos to replace placeholder images. Uploads automatically become the primary photo.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="placeholders">
              <TabsList>
                <TabsTrigger value="placeholders">
                  Needs photo ({placeholders.length})
                </TabsTrigger>
                <TabsTrigger value="real">Has photo ({real.length})</TabsTrigger>
                <TabsTrigger value="all">All ({vehicles?.length ?? 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="placeholders" className="mt-4">
                {placeholders.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        All vehicles have real photos
                      </CardTitle>
                      <CardDescription>Nice work — no placeholders remaining.</CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {placeholders.map(renderVehicle)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="real" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {real.map(renderVehicle)}
                </div>
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(vehicles ?? []).map(renderVehicle)}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPhotos;
