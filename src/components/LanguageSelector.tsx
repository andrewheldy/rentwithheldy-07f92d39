import { useTranslation } from "react-i18next";
import { Check, Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/i18n/languages";
import { normalizeLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
  /** Larger touch target + full-width trigger for the mobile menu. */
  variant?: "compact" | "block";
}

/**
 * Language picker built on the Radix dropdown already used in the header, so it
 * inherits click-to-open, roving keyboard focus, Escape-to-close,
 * click-outside-to-close, and focus-return-to-trigger for free. Native language
 * names, no flags. The Globe icon is not mirrored in RTL.
 */
const LanguageSelector = ({
  className,
  variant = "compact",
}: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation("common");
  const active = normalizeLocale(i18n.language);
  const activeOption =
    LANGUAGES.find((l) => l.code === active) ?? LANGUAGES[0];

  const change = (code: string) => {
    if (code !== active) void i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("languageSelector.label")}
        title={t("languageSelector.label")}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-control border border-border/70 font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "compact"
            ? "h-9 px-2.5 text-sm"
            : "h-11 w-full justify-center px-4 text-base",
          className,
        )}
      >
        <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{activeOption.shortLabel}</span>
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem] p-1.5">
        {LANGUAGES.map((l) => {
          const isActive = l.code === active;
          return (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => change(l.code)}
              aria-current={isActive ? "true" : undefined}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-control py-2.5"
            >
              <span
                dir={l.dir}
                className={cn(
                  "text-[15px]",
                  isActive ? "font-semibold text-foreground" : "text-foreground/80",
                )}
              >
                {l.nativeName}
              </span>
              {isActive && (
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
