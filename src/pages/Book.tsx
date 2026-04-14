import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Book = () => {
  useEffect(() => {
    // Re-initialize Wheelbase widget if script already loaded
    if (typeof (window as any).Outdoorsy !== "undefined" && (window as any).Outdoorsy.init) {
      (window as any).Outdoorsy.init();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Book Your Vehicle
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search available dates and choose from our fleet of quality vehicles.
          </p>
        </div>

        {/* Wheelbase Booking Widget */}
        <div className="max-w-4xl mx-auto">
          <div
            id="outdoorsy-book-now-container"
            data-owner="4913818"
            data-color="000000"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Book;
