import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown instead of the real admin/auth UI whenever Supabase isn't
 * configured (see integrations/supabase/client.ts). Admin tooling is
 * internal-only and, like the rest of the admin area, is not localized.
 */
const AdminNotConfigured = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Admin authentication is not configured
        </h1>
        <p className="text-muted-foreground">
          This deployment has no Supabase credentials, so admin sign-in and
          fleet-management tools are unavailable. The public site is
          unaffected.
        </p>
        <Link to="/" className="inline-block text-primary hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default AdminNotConfigured;
