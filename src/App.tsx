import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Book from "./pages/Book";
import Confirmation from "./pages/Confirmation";
import About from "./pages/About";
import AddCar from "./pages/AddCar";
import AdminLeads from "./pages/AdminLeads";
import Auth from "./pages/Auth";
import Fleet from "./pages/Fleet";
import FortLauderdale from "./pages/FortLauderdale";
import Miami from "./pages/Miami";
import LocalCarRentals from "./pages/LocalCarRentals";
import RentToOwn from "./pages/RentToOwn";
import DriveToOwn from "./pages/DriveToOwn";
import FLLAirport from "./pages/FLLAirport";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

import BodyShopDelivery from "./pages/BodyShopDelivery";
import CruisePortDelivery from "./pages/CruisePortDelivery";
import HotelConciergeRentals from "./pages/HotelConciergeRentals";
import LossOfUseClaims from "./pages/LossOfUseClaims";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/book" element={<Book />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route
              path="/car-rental-fort-lauderdale"
              element={<FortLauderdale />}
            />
            <Route path="/local-car-rentals" element={<LocalCarRentals />} />
            <Route path="/car-rental-miami" element={<Miami />} />
            <Route path="/rent-to-own" element={<RentToOwn />} />
            <Route path="/drive-to-own" element={<DriveToOwn />} />
            <Route path="/chariot" element={<DriveToOwn />} />
            <Route
              path="/fort-lauderdale-airport-car-rental"
              element={<FLLAirport />}
            />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/insurance-replacement" element={<Navigate to="/body-shop-delivery" replace />} />
            <Route path="/body-shop-delivery" element={<BodyShopDelivery />} />
            <Route path="/cruise-port-delivery" element={<CruisePortDelivery />} />
            <Route path="/hotel-concierge-rentals" element={<HotelConciergeRentals />} />
            <Route path="/loss-of-use-claims" element={<LossOfUseClaims />} />
            <Route
              path="/confirmation/:reservationId"
              element={<Confirmation />}
            />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            {/* Redirect old routes */}
            <Route path="/categories" element={<Navigate to="/fleet" replace />} />
            <Route
              path="/reserve/:categorySlug"
              element={<Navigate to="/book" replace />}
            />
            <Route path="/vehicles" element={<Navigate to="/fleet" replace />} />
            <Route path="/vehicle/:id" element={<Navigate to="/fleet" replace />} />
            <Route
              path="/addcars"
              element={
                <ProtectedRoute requireAdmin>
                  <AddCar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leads"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLeads />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
