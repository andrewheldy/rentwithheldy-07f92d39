import type { TuroProblem } from "./parse.js";
import type { TuroImportSummary } from "./plan.js";

/** Response of POST /api/turo-import (both "check" and "import"). */
export type TuroImportResult = {
  mode: "check" | "import";
  fileName: string;
  /** Blocking problems. Nothing is written while any exist. */
  problems: TuroProblem[];
  summary: TuroImportSummary | null;
  extraColumns: string[];
  droppedColumns: string[];
  /** Set after an import: the sync_runs row that records it. */
  runId?: string;
};
