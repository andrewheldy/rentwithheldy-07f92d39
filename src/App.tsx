import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import Reserve from "./pages/Reserve";
import Confirmation from "./pages/Confirmation";
import About from "./pages/About";
import AddCar from "./pages/AddCar";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reserve/:categorySlug" element={<Reserve />} />
            <Route path="/confirmation/:reservationId" element={<Confirmation />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            {/* Redirect old vehicle routes to categories */}
            <Route path="/vehicles" element={<Navigate to="/categories" replace />} />
            <Route path="/vehicle/:id" element={<Navigate to="/categories" replace />} />
            <Route 
              path="/addcars" 
              element={
                <ProtectedRoute requireAdmin>
                  <AddCar />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
