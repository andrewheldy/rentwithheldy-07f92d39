import { Check } from "lucide-react";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

interface ChoiceFieldProps {
  legend: string;
  name: string;
  options: ChoiceOption[];
  selected: string[];
  multiple?: boolean;
  columns?: 1 | 2;
  onChange: (value: string, checked: boolean) => void;
}

const ChoiceField = ({
  legend,
  name,
  options,
  selected,
  multiple = false,
  columns = 2,
  onChange,
}: ChoiceFieldProps) => (
  <fieldset>
    <legend className="sr-only">{legend}</legend>
    <div className={columns === 1 ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
      {options.map((option) => {
        const checked = selected.includes(option.value);
        const id = `${name}-${option.value}`;
        return (
          <div key={option.value} className="relative min-w-0">
            <input
              id={id}
              name={name}
              type={multiple ? "checkbox" : "radio"}
              value={option.value}
              checked={checked}
              onChange={(event) => onChange(option.value, event.target.checked)}
              className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
            <label
              htmlFor={id}
              className="flex min-h-[72px] cursor-pointer items-start justify-between gap-4 rounded-control border border-border bg-background px-4 py-4 text-start transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/50 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-checked:border-primary peer-checked:bg-primary/[0.06] peer-checked:shadow-card sm:px-5"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border transition-colors ${
                  multiple ? "rounded-md" : "rounded-full"
                } ${
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-transparent"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </label>
          </div>
        );
      })}
    </div>
  </fieldset>
);

export default ChoiceField;
