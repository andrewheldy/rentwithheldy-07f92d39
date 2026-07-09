import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WheelbaseWidget from "@/components/WheelbaseWidget";

const Book = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Book Your Vehicle
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Browse our fleet, select your dates, and complete your reservation
            — all in one place.
          </p>
        </div>
        <WheelbaseWidget />
      </main>
      <Footer />
    </div>
  );
};

export default Book;
