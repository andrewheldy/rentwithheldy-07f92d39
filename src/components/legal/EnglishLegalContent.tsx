import { type ReactNode } from "react";

/**
 * ENGLISH-ONLY LEGAL CONTENT — LTR WRAPPER
 * ----------------------------------------
 * Renders an English legal body (read from the single English source of truth
 * via `useEnglishT`) and pins it to LTR + `lang="en"`, so it stays correctly
 * oriented and readable even when the surrounding page is RTL (Hebrew). The
 * legal text itself is never translated — see `useEnglishT` for the policy.
 *
 * Reusable: wrap any English-only legal block with this. Pair it with
 * <EnglishLegalNotice> immediately above to explain, in the reader's language,
 * why the section is in English.
 */
export function EnglishLegalContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div dir="ltr" lang="en" className={className}>
      {children}
    </div>
  );
}

export default EnglishLegalContent;
