import { cn } from "@/lib/utils";

interface SectionIntroProps {
  title: string;
  body?: string;
  label?: string;
  titleId?: string;
  className?: string;
}

export function SectionIntro({ title, body, label, titleId, className }: SectionIntroProps) {
  return (
    <header className={cn("ai-section-intro", className)}>
      {label ? <p className="ai-kicker">{label}</p> : null}
      <h2 id={titleId}>{title}</h2>
      {body ? <p>{body}</p> : null}
    </header>
  );
}
