import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "@/i18n/config";
import { CTA_PRESETS } from "@/lib/blog/presets";
import type { BlogCategory } from "@/lib/blog/types";

// Dates are shown in South Florida time so every reader sees the same
// calendar day the post was published.
const TIME_ZONE = "America/New_York";

export function useBlogFormat() {
  const { t, i18n } = useTranslation("blog");
  const locale = normalizeLocale(i18n.language);

  const formatDate = useCallback(
    (iso: string | null | undefined) => {
      if (!iso) return "";
      return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: TIME_ZONE }).format(new Date(iso));
    },
    [locale],
  );

  /** Seeded categories have localized labels; new ones fall back to their CMS name. */
  const categoryLabel = useCallback(
    (category: Pick<BlogCategory, "slug" | "name"> | null | undefined) =>
      category ? t(`categories.${category.slug}`, { defaultValue: category.name }) : "",
    [t],
  );

  /** Preset CTA labels are localized; a custom label is shown as written. */
  const ctaLabel = useCallback(
    (label: string, url: string) => {
      const preset = CTA_PRESETS.find((p) => p.label === label && p.url === url);
      return preset ? t(`article.ctaPresets.${preset.id}`) : label;
    },
    [t],
  );

  return { t, locale, formatDate, categoryLabel, ctaLabel };
}
