import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import type { Matcher } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePreset = {
  label: string;
  value: string;
};

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  fromYear?: number;
  toYear?: number;
  disabledDates?: Matcher | Matcher[];
  presets?: DatePreset[];
  helpText?: string;
  initialMonth?: Date;
};

const toDate = (value: string) => {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
};

export function AgreementDateField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  fromYear = new Date().getFullYear() - 5,
  toYear = new Date().getFullYear() + 15,
  disabledDates,
  presets = [],
  helpText,
  initialMonth,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => toDate(value), [value]);
  const helpId = helpText ? `${id}-help` : undefined;
  const defaultMonth = selected ?? initialMonth ?? new Date(Math.min(Math.max(new Date().getFullYear(), fromYear), toYear), 0, 1);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-required={required}
              aria-describedby={helpId}
              aria-label={`${label}: ${selected ? format(selected, "MMMM d, yyyy") : "not selected"}`}
              className={cn(
                "min-h-11 flex-1 justify-start text-start font-normal",
                !selected && "text-muted-foreground",
              )}
            >
              <CalendarDays className="me-2 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{selected ? format(selected, "MMM d, yyyy") : "Choose date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[calc(100vw-2rem)] max-w-sm p-0">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={defaultMonth}
              onSelect={(date) => {
                if (!date) return;
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }}
              captionLayout="dropdown-buttons"
              fromYear={fromYear}
              toYear={toYear}
              disabled={disabledDates}
              initialFocus
              className="mx-auto"
            />
            {(presets.length > 0 || selected) && (
              <div className="flex flex-wrap gap-2 border-t border-border p-3">
                {presets.map((preset) => (
                  <Button
                    key={`${preset.label}-${preset.value}`}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => { onChange(preset.value); setOpen(false); }}
                  >
                    {preset.label}
                  </Button>
                ))}
                {selected && !required && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => { onChange(""); setOpen(false); }}>
                    <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" /> Clear
                  </Button>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
      {helpText && <p id={helpId} className="text-xs leading-5 text-muted-foreground">{helpText}</p>}
    </div>
  );
}
