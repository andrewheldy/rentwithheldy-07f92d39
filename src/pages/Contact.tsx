import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Phone, Mail, MapPin, MessageSquare } from "lucide-react";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { insertLead } from "@/lib/leads";
import {
  buildBreadcrumbSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

// `value` is the STABLE string persisted to Supabase / emailed to the team —
// never translate it. `key` drives only the visible label.
const CONTACT_REASONS = [
  { value: "Book a rental", key: "book" },
  { value: "Question about an existing booking", key: "existingBooking" },
  { value: "Body shop / insurance rental", key: "bodyShop" },
  { value: "Hotel delivery", key: "hotelDelivery" },
  { value: "Airport pickup", key: "airportPickup" },
  { value: "Rent-To-Own inquiry", key: "rentToOwn" },
  { value: "Partner / business inquiry", key: "partner" },
  { value: "Other", key: "other" },
] as const;

const Contact = () => {
  const { t } = useTranslation(["contact", "common"]);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (!name || !phone || !reason || !message) {
      toast({
        title: t("toast.checkDetailsTitle"),
        description: t("toast.checkDetailsDesc"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const notesComposed = [
      `Reason: ${reason}`,
      `Message: ${message}`,
      `[Source: contact]`,
      `[Lead Type: Contact]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].join(" | ");

    const { error } = await insertLead({
      form_type: "contact",
      vertical_path: "contact",
      service_context: reason,
      passenger_type: "Other",
      name,
      phone,
      email: email || null,
      notes: notesComposed,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (error) {
      console.error("Contact insert failed", error);
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.errorDesc", { phone: CONTACT_PHONE_DISPLAY }),
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const subject = `Contact Form — ${reason}`;
    const body = `Source: contact\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nReason: ${reason}\nMessage: ${message}\nSubmitted: ${new Date().toISOString()}`;
    window.location.href = `mailto:rentwithheldy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({
      title: t("toast.successTitle"),
      description: t("toast.successDesc"),
    });
    (e.target as HTMLFormElement).reset();
    setReason("");
    setTimeout(() => setSubmitting(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path="/contact"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <Header />
      <main>
        <section className="bg-secondary py-14">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            <Card className="border-none shadow-card-hover">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold mb-1">{t("cards.call.title")}</h2>
                <a
                  href={CONTACT_PHONE_HREF}
                  dir="ltr"
                  className="text-primary font-medium hover:underline"
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
                <p className="text-xs text-muted-foreground mt-2">{t("cards.call.note")}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-card-hover">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold mb-1">{t("cards.email.title")}</h2>
                <a
                  href="mailto:rentwithheldy@gmail.com"
                  dir="ltr"
                  className="text-primary font-medium hover:underline break-all"
                >
                  rentwithheldy@gmail.com
                </a>
                <p className="text-xs text-muted-foreground mt-2">{t("cards.email.note")}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-card-hover">
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold mb-1">{t("cards.serviceArea.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("cards.serviceArea.value")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-primary/20 bg-card shadow-tropical overflow-hidden">
              <div className="bg-gradient-tropical px-6 py-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
                <h2 className="text-lg font-bold text-primary-foreground">{t("form.heading")}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ct-name">{t("form.fields.name")}</Label>
                    <Input id="ct-name" name="name" required maxLength={80} autoComplete="name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ct-phone">{t("form.fields.phone")}</Label>
                    <Input id="ct-phone" name="phone" required type="tel" maxLength={20} autoComplete="tel" inputMode="tel" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="ct-email">{t("form.fields.email")}</Label>
                    <Input id="ct-email" name="email" type="email" maxLength={120} autoComplete="email" placeholder={t("form.fields.emailPlaceholder")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="ct-reason">{t("form.fields.reason")}</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger id="ct-reason" className="h-10">
                        <SelectValue placeholder={t("form.reasonPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_REASONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{t(`form.reasons.${r.key}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="ct-message">{t("form.fields.message")}</Label>
                    <Textarea id="ct-message" name="message" required maxLength={1000} rows={5} placeholder={t("form.fields.messagePlaceholder")} />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                >
                  {submitting ? t("form.sending") : t("form.submit")}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("form.preferToTalk")}{" "}
                  <a href={CONTACT_PHONE_HREF} dir="ltr" className="text-primary hover:underline">{CONTACT_PHONE_DISPLAY}</a>
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
