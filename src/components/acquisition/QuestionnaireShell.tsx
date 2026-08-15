import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuestionnaireShellProps {
  eyebrow: string;
  heading: string;
  help?: string;
  step: number;
  totalSteps: number;
  stepLabel: string;
  backLabel: string;
  continueLabel: string;
  submittingLabel: string;
  disclaimer: string;
  canContinue: boolean;
  submitting?: boolean;
  error?: string | null;
  onBack: () => void;
  onContinue: () => void | Promise<void>;
  onInvalid: () => void;
  children: ReactNode;
}

const QuestionnaireShell = ({
  eyebrow,
  heading,
  help,
  step,
  totalSteps,
  stepLabel,
  backLabel,
  continueLabel,
  submittingLabel,
  disclaimer,
  canContinue,
  submitting = false,
  error,
  onBack,
  onContinue,
  onInvalid,
  children,
}: QuestionnaireShellProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progress = ((step + 1) / totalSteps) * 100;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!canContinue) {
      onInvalid();
      return;
    }
    void onContinue();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-card border border-border bg-card shadow-elevated"
      noValidate
    >
      <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="relative hidden overflow-hidden bg-ink p-8 text-ink-foreground md:flex md:flex-col">
          <div className="absolute inset-y-0 end-0 w-px bg-white/10" aria-hidden />
          <div className="inline-flex w-fit items-center gap-2 border border-white/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
            <Route className="h-4 w-4 text-primary" />
            {eyebrow}
          </div>
          <div className="mt-auto">
            <p className="text-5xl font-heading font-semibold tabular-nums text-white">
              {String(step + 1).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm text-white/55">
              {stepLabel}
            </p>
            <div
              className="mt-6 space-y-2"
              role="progressbar"
              aria-label={stepLabel}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={step + 1}
              aria-valuetext={stepLabel}
            >
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 transition-colors duration-200 ${
                    index <= step ? "bg-primary" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
            <p className="mt-6 max-w-[11rem] text-sm leading-6 text-white/60">
              {disclaimer}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="bg-ink px-5 py-4 text-ink-foreground md:hidden">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.14em]">
              <span>{eyebrow}</span>
              <span aria-live="polite">{stepLabel}</span>
            </div>
            <Progress
              value={progress}
              aria-label={stepLabel}
              className="mt-3 h-1.5 bg-white/15"
            />
          </div>

          <div className="flex flex-1 flex-col px-5 py-8 sm:px-9 sm:py-10 lg:px-14 lg:py-12">
            <div key={step} className="animate-fade-in">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {eyebrow}
              </p>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="mt-3 max-w-2xl text-heading font-semibold text-ink outline-none"
              >
                {heading}
              </h2>
              {help && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {help}
                </p>
              )}
              <div className="mt-7">{children}</div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-6 border-s-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={step === 0 || submitting}
                className="min-h-11 px-3"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                {backLabel}
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="min-h-12 min-w-36"
              >
                {submitting ? submittingLabel : continueLabel}
                {!submitting && <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default QuestionnaireShell;
