import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOwnerDashboard } from "@/components/owner/OwnerContext";
import { toast } from "@/hooks/use-toast";
import { agreementDownloadUrl } from "@/lib/owner/api";
import { formatDay } from "@/lib/owner/format";

export default function OwnerDocuments() {
  const { t, i18n } = useTranslation("owner");
  const { data } = useOwnerDashboard();
  const [downloading, setDownloading] = useState<string | null>(null);
  if (!data) return null;

  const download = async (id: string, path: string) => {
    setDownloading(id);
    try {
      window.location.assign(await agreementDownloadUrl(path));
    } catch {
      toast({ title: t("documents.downloadError"), variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("documents.title")}</h1>
        <p className="text-muted-foreground">{t("documents.subtitle")}</p>
      </div>
      {data.agreements.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t("documents.empty")}</p>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {data.agreements.map((agreement) => (
            <li key={agreement.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-6 w-6 shrink-0 text-primary-text" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-medium">{t("documents.agreement", { number: agreement.agreement_number })}</p>
                    {agreement.executed_at && (
                      <p className="text-sm text-muted-foreground">
                        {t("documents.signed", { date: formatDay(agreement.executed_at, i18n.language) })}
                      </p>
                    )}
                  </div>
                </div>
                {agreement.final_pdf_path && (
                  <Button
                    variant="outline"
                    disabled={downloading === agreement.id}
                    onClick={() => void download(agreement.id, agreement.final_pdf_path!)}
                  >
                    {downloading === agreement.id ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="me-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {t("documents.download")}
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
