import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, Car, Plus } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const addCarSchema = z.object({
  vin: z.string().min(17, "VIN must be 17 characters").max(17, "VIN must be 17 characters"),
  make: z.string().min(1, "Make is required").max(50, "Make must be less than 50 characters"),
  model: z.string().min(1, "Model is required").max(50, "Model must be less than 50 characters"),
  year: z.string().min(4, "Year is required").max(4, "Year must be 4 digits"),
  licensePlate: z.string().min(1, "License plate is required").max(10, "License plate must be less than 10 characters"),
  color: z.string().min(1, "Color is required").max(30, "Color must be less than 30 characters"),
  initialMileage: z.string().min(1, "Initial mileage is required"),
  dailyRate: z.string().min(1, "Daily rate is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
});

type AddCarFormData = z.infer<typeof addCarSchema>;

const AddCar = () => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const form = useForm<AddCarFormData>({
    resolver: zodResolver(addCarSchema),
    defaultValues: {
      vin: "",
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      color: "",
      initialMileage: "",
      dailyRate: "",
      description: "",
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPhotos((prev) => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: AddCarFormData) => {
    const vehicleData = {
      ...data,
      dateAdded: new Date().toISOString(),
      photos,
    };
    
    console.log("Vehicle submitted:", vehicleData);
    
    toast({
      title: "Vehicle Added Successfully!",
      description: `${data.year} ${data.make} ${data.model} has been added to the fleet.`,
    });
    
    form.reset();
    setPhotos([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Car className="h-8 w-8 text-primary" />
              Add New Vehicle
            </h1>
            <p className="text-muted-foreground mt-2">
              Add a new vehicle to the Rent with Heldy fleet
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                  <CardDescription>Basic details about the vehicle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN (Vehicle Identification Number)</FormLabel>
                        <FormControl>
                          <Input placeholder="1HGBH41JXMN109186" {...field} maxLength={17} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make</FormLabel>
                          <FormControl>
                            <Input placeholder="Toyota" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="Corolla" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input placeholder="2024" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="licensePlate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Plate</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC1234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input placeholder="Silver" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dailyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Rate ($)</FormLabel>
                        <FormControl>
                          <Input placeholder="45" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Comfortable sedan perfect for city driving..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Admin-Only Information */}
              <Card className="border-dashed border-2 border-muted-foreground/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Admin Only</span>
                    Internal Information
                  </CardTitle>
                  <CardDescription>This information will not be shown on the public listing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="initialMileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Mileage</FormLabel>
                        <FormControl>
                          <Input placeholder="25000" type="number" {...field} />
                        </FormControl>
                        <FormDescription>Current odometer reading when added to fleet</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Date of Addition:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    <span className="text-xs">(Auto-recorded on submission)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Photo Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Photos</CardTitle>
                  <CardDescription>Add multiple photos of the vehicle (exterior, interior, features)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drag and Drop Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-foreground font-medium mb-1">
                      Drag and drop photos here
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      or click to browse
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button type="button" variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Photos
                        </span>
                      </Button>
                    </label>
                  </div>

                  {/* Photo Preview Grid */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Vehicle photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Clear Form
                </Button>
                <Button type="submit" className="bg-gradient-tropical text-white">
                  Add Vehicle to Fleet
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default AddCar;
