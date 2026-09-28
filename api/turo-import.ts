import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configurePrivateResponse, createServerSupabase, requireAdmin } from "../src/server/agreements/server.js";
import { runTuroImport } from "../src/server/turo/import.js";

// POST { csv, fileName, mode: "check" | "import" } — admins only.
// "check" parses the Turo trip earnings export and compares it with what is
// stored, without writing. "import" does the same and, when there are no
// problems, saves the trips and earnings and records a sync_runs row.

const MAX_CSV_CHARS = 4_000_000; // Vercel's request body limit is 4.5 MB.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  configurePrivateResponse(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let supabase;
  try {
    supabase = createServerSupabase();
  } catch (error) {
    console.error("turo-import:", (error as Error).message);
    return res.status(500).json({ error: "The server isn't configured for imports." });
  }
  const user = await requireAdmin(req, res, supabase);
  if (!user) return;

  const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {}) as Record<string, unknown>;
  const { csv, fileName, mode } = body;
  if (mode !== "check" && mode !== "import") return res.status(400).json({ error: "Unknown import mode." });
  if (typeof csv !== "string" || csv.trim() === "") return res.status(400).json({ error: "The file is empty." });
  if (csv.length > MAX_CSV_CHARS) {
    return res.status(413).json({ error: "The file is too large. Export a shorter date range from Turo and upload it in parts." });
  }
  const name = typeof fileName === "string" && fileName.trim() ? fileName.trim().slice(0, 200) : "turo-export.csv";

  try {
    const result = await runTuroImport(supabase, { csv, fileName: name, mode, userId: user.id });
    return res.status(200).json(result);
  } catch (error) {
    console.error("turo-import:", (error as Error).message);
    return res.status(500).json({
      error:
        mode === "import"
          ? "The import stopped partway. Nothing is double-counted: upload the same file again to finish it."
          : "Could not check the file. Try again.",
    });
  }
}
