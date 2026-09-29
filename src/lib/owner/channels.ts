import type { Channel } from "./metrics";

// Series colors come from design tokens (--chart-wheelbase / --chart-turo),
// validated with the dataviz palette checks (CVD separation, chroma, contrast).
export const CHANNEL_COLOR: Record<Channel, string> = {
  wheelbase: "hsl(var(--chart-wheelbase))",
  turo: "hsl(var(--chart-turo))",
};

/** Platform names are proper nouns: the same in every language. */
export const PLATFORM_NAME: Record<Channel, string> = { wheelbase: "Wheelbase", turo: "Turo" };
