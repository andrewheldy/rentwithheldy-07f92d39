import SEO from "@/components/SEO";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { ProfileForm } from "@/components/account/ProfileForm";

export default function AdminSettings() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Account settings · Rent With Heldy Admin" description="Your admin account settings." path="/admin/settings" noIndex />
      <AdminSectionHeader title="Account settings" />
      <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h2 className="text-3xl font-semibold">Your profile</h2>
          <p className="mt-2 text-muted-foreground">Your name, phone, language and sign-in email for this admin account.</p>
        </div>
        <ProfileForm />
      </main>
    </div>
  );
}
