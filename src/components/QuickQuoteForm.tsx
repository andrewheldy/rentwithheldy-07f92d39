import { useState } from "react";
import { z } from "zod";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone")
    .max(20),
  location: z.string().trim().min(2, "Where should we deliver?").max(120),
  when: z.string().trim().min(2, "When do you need it?").max(80),
  notes: z.string().trim().max(500).optional(),
});

interface QuickQuoteFormProps {
  /** Where the form is shown (used in the email subject) */
  serviceContext: string;
  /** Heading shown above the form */
  title?: string;
  /** Sub-heading shown above the form */
  subtitle?: string;
  /** Button label */
  ctaLabel?: string;
}

const QuickQuoteForm = ({
  serviceContext,
  title = "Request Immediate Delivery",
  subtitle = "Tell us where and when. We'll text you back fast with a quote.",
  ctaLabel = "Get My Quick Quote",
}: QuickQuoteFormProps) => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      phone: fd.get("phone"),
      location: fd.get("location"),
      when: fd.get("when"),
      notes: fd.get("notes") ?? "",
    });
    if (!parsed.success) {
      toast({
        title: "Please check your details",
        description: parsed.error.issues[0]?.message ?? "Invalid input",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { name, phone, location, when, notes } = parsed.data;
    const subject = `Quick Quote — ${serviceContext}`;
    const body = `Service: ${serviceContext}\nName: ${name}\nPhone: ${phone}\nDelivery Location: ${location}\nWhen: ${when}\nNotes: ${notes ?? ""}`;
    window.location.href = `mailto:rentwithheldy@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    toast({
      title: "Opening your email",
      description: "Send the message and we'll respond within minutes.",
    });
    setTimeout(() => setSubmitting(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card shadow-tropical overflow-hidden">
      <div className="bg-gradient-tropical px-6 py-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">{title}</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="qq-name">Full Name</Label>
            <Input id="qq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qq-phone">Mobile Phone</Label>
            <Input
              id="qq-phone"
              name="phone"
              required
              type="tel"
              maxLength={20}
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-location">Delivery Location</Label>
            <Input
              id="qq-location"
              name="location"
              required
              maxLength={120}
              placeholder="Hotel, body shop, port, address…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-when">When do you need the car?</Label>
            <Input
              id="qq-when"
              name="when"
              required
              maxLength={80}
              placeholder="ASAP, today 4pm, Sat 6/14 morning…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-notes">Anything else? (optional)</Label>
            <Textarea
              id="qq-notes"
              name="notes"
              maxLength={500}
              rows={3}
              placeholder="Vehicle type, insurance carrier, claim #, flight…"
            />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? "Opening…" : ctaLabel}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Prefer to talk? Call{" "}
          <a href="tel:+15615198958" className="text-primary hover:underline">
            (561) 519-8958
          </a>
        </p>
      </form>
    </div>
  );
};

export default QuickQuoteForm;
