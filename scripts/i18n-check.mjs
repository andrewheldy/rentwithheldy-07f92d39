// Translation completeness report. English is the canonical key set; every
// other locale is compared against it.
//
//   node scripts/i18n-check.mjs            (or: npm run i18n:check)
//   node scripts/i18n-check.mjs --strict   (fail on ANY untranslated key)
//
// Default (Phase 1) exit codes:
//   0  — English is valid and no locale has structural problems. Missing keys
//        are fine: they intentionally fall back to English.
//   1  — a HARD problem exists: invalid JSON, an empty-string value, or an
//        "extra" key present in a locale but not in English.
// With --strict, any key not yet translated also fails (use once Phase 2 lands).
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(here, "../src/i18n/locales");
const SOURCE = "en";
const TARGETS = ["es", "fr", "pt", "he"];
const STRICT = process.argv.includes("--strict");

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function loadJson(file) {
  try {
    return { data: JSON.parse(readFileSync(file, "utf8")) };
  } catch (e) {
    return { error: e.message };
  }
}

let hardErrors = 0;
let strictFailures = 0;

// ---- Load + validate the canonical English set --------------------------
const namespaces = readdirSync(join(LOCALES_DIR, SOURCE)).filter((f) =>
  f.endsWith(".json"),
);
const enFlat = {};
for (const ns of namespaces) {
  const { data, error } = loadJson(join(LOCALES_DIR, SOURCE, ns));
  if (error) {
    console.error(`✗ en/${ns}: invalid JSON — ${error}`);
    hardErrors++;
    continue;
  }
  const flat = flatten(data);
  enFlat[ns] = flat;
  for (const [k, v] of Object.entries(flat)) {
    if (v === "") {
      console.error(`✗ en/${ns}: empty value at "${k}" (source must not be empty)`);
      hardErrors++;
    }
  }
}

const enTotal = Object.values(enFlat).reduce(
  (n, f) => n + Object.keys(f).length,
  0,
);
console.log(
  `Canonical en: ${namespaces.length} namespaces, ${enTotal} keys\n`,
);

// ---- Compare each target locale -----------------------------------------
for (const target of TARGETS) {
  const dir = join(LOCALES_DIR, target);
  let translated = 0;
  let missing = 0;
  let extra = 0;
  let empty = 0;

  for (const ns of namespaces) {
    const file = join(dir, ns);
    const enKeys = Object.keys(enFlat[ns] ?? {});
    if (!existsSync(file)) {
      missing += enKeys.length;
      continue;
    }
    const { data, error } = loadJson(file);
    if (error) {
      console.error(`✗ ${target}/${ns}: invalid JSON — ${error}`);
      hardErrors++;
      continue;
    }
    const flat = flatten(data);
    const enKeySet = new Set(enKeys);
    for (const k of enKeys) {
      if (!(k in flat)) missing++;
      else if (flat[k] === "") {
        empty++;
        hardErrors++;
        console.error(`✗ ${target}/${ns}: empty value at "${k}"`);
      } else translated++;
    }
    for (const k of Object.keys(flat)) {
      if (!enKeySet.has(k)) {
        extra++;
        hardErrors++;
        console.error(`✗ ${target}/${ns}: extra key "${k}" not present in en`);
      }
    }
  }

  strictFailures += missing;
  const pct = enTotal ? Math.round((translated / enTotal) * 100) : 0;
  const flag = extra || empty ? "✗" : "○";
  console.log(
    `${flag} ${target}: ${translated}/${enTotal} translated (${pct}%), ` +
      `${missing} falling back to English` +
      (extra ? `, ${extra} EXTRA` : "") +
      (empty ? `, ${empty} EMPTY` : ""),
  );
}

console.log("");
if (hardErrors) {
  console.error(`i18n:check FAILED — ${hardErrors} structural error(s).`);
  process.exit(1);
}
if (STRICT && strictFailures) {
  console.error(
    `i18n:check --strict FAILED — ${strictFailures} key(s) not yet translated.`,
  );
  process.exit(1);
}
console.log(
  "i18n:check passed. Untranslated keys fall back to English (expected in Phase 1).",
);
process.exit(0);
