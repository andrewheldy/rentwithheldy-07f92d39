import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { normalizeLocale } from "@/i18n/config";

/**
 * ENGLISH-ONLY LEGAL CONTENT — TRANSLATED PREFACE
 * -----------------------------------------------
 * A small, professional notice shown immediately before an English-only legal
 * section (see <EnglishLegalContent>). ONLY this notice is translated — never
 * the legal body it introduces.
 *
 * It is hidden for English readers, so the English experience is byte-for-byte
 * unchanged. For every other locale it renders in the reader's language and
 * follows the page direction (RTL in Hebrew), while the legal body below stays
 * LTR. The notice copy lives in the `legal` namespace under `englishNotice`.
 */
export function EnglishLegalNotice({ className }: { className?: string }) {
  const { t, i18n } = useTranslation("legal");

  // English readers already see the document in its authored language, so no
  // notice is needed — this keeps the English page exactly as before.
  if (normalizeLocale(i18n.language) === "en") return null;

  return (
    <aside
      role="note"
      className={`rounded-lg border border-border bg-secondary/40 p-4 md:p-5 ${
        className ?? ""
      }`}
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="font-semibold text-foreground">
            {t("englishNotice.heading")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("englishNotice.body")}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default EnglishLegalNotice;
