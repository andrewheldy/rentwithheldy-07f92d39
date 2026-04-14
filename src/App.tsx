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
            <Route path="/book" element={<Book />} />
            <Route path="/confirmation/:reservationId" element={<Confirmation />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            {/* Redirect old routes */}
            <Route path="/categories" element={<Navigate to="/book" replace />} />
            <Route path="/reserve/:categorySlug" element={<Navigate to="/book" replace />} />
            <Route path="/vehicles" element={<Navigate to="/book" replace />} />
            <Route path="/vehicle/:id" element={<Navigate to="/book" replace />} />
            <Route 
              path="/addcars" 
              element={
                <ProtectedRoute requireAdmin>
                  <AddCar />
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
