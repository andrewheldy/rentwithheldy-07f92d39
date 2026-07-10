// Translation completeness + integrity report. English is the canonical key
// set; every other locale is compared against it.
//
//   node scripts/i18n-check.mjs            (or: npm run i18n:check)
//   node scripts/i18n-check.mjs --strict   (also fail on ANY untranslated key)
//
// HARD errors (exit 1) — a real defect that would ship broken UI:
//   • invalid JSON
//   • an empty-string value
//   • an "extra" key present in a locale but not in English
//   • a placeholder / markup mismatch ({{var}} or <tag> set differs from English)
//   • an array whose length or element shape differs from English (i18next
//     REPLACES arrays wholesale, so a short array silently drops list items)
//
// WARNINGS (never fail unless --strict) — likely-untranslated copy:
//   • a translated value byte-identical to English in a non-legal namespace,
//     excluding whitelisted proper nouns and intentional English-only keys.
//
// Missing keys are NOT a hard error: they intentionally fall back to English.
// With --strict, any missing key also fails (use for a "100% translated" gate).
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(here, "../src/i18n/locales");
const SOURCE = "en";
const TARGETS = ["es", "fr", "pt", "he"];
const STRICT = process.argv.includes("--strict");

// ---- English-only + proper-noun whitelist ------------------------------------
// Substantive legal content is authored ENGLISH-ONLY (see src/i18n/useEnglishT
// and the legal-content policy). These key prefixes are read from the English
// bundle at runtime and never translated, so they are exempt from the
// English-identical warning. Keyed by namespace (without .json).
const ENGLISH_ONLY = {
  legal: ["privacy", "terms"], // Terms/Privacy legal bodies
  services: ["lossOfUse.body", "lossOfUse.faqs"], // Loss-of-Use legal body + legal FAQs
};

// Authentic testimonial quotes and customer names must remain verbatim in
// their source language. Labels such as "Verified Turo guest" still localize.
const ORIGINAL_LANGUAGE = {
  services: [
    "airport.testimonial.quote",
    "airport.testimonial.name",
    "hotel.testimonial.quote",
    "hotel.testimonial.name",
    "bodyShop.testimonial.quote",
    "bodyShop.testimonial.name",
    "cruise.testimonial.quote",
    "cruise.testimonial.name",
  ],
};

// Values that are legitimately identical across every locale (proper nouns,
// codes, symbols). A translated string equal to one of these is NOT flagged.
const PROPER_NOUN_VALUES = new Set([
  "404",
  "Miami",
  "Fort Lauderdale",
  "Fort Lauderdale • Miami",
  "Fort Lauderdale · Miami",
  "All-Star Host", // Turo status/brand term — kept verbatim in every locale
  "you@email.com", // example email placeholder — identical in every locale by design
]);

function isEnglishOnly(ns, key) {
  return (ENGLISH_ONLY[ns] ?? []).some(
    (p) => key === p || key.startsWith(p + "."),
  );
}

function isOriginalLanguage(ns, key) {
  return (ORIGINAL_LANGUAGE[ns] ?? []).includes(key);
}

function markup(str) {
  if (typeof str !== "string") return "";
  const tokens = [
    ...(str.match(/\{\{[^}]+\}\}/g) ?? []),
    ...(str.match(/<[^>]+>/g) ?? []),
  ];
  return tokens.sort().join("|");
}

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

// Recursively verify that a locale value has the same array/markup shape as the
// English source. Pushes human-readable messages onto `errs`. Only descends
// where the locale actually provides a value (absent = benign fallback).
function checkShape(enVal, locVal, path, errs) {
  if (locVal === undefined) return; // falls back to English — fine
  if (Array.isArray(enVal)) {
    if (!Array.isArray(locVal)) {
      errs.push(`${path}: expected an array, got ${typeof locVal}`);
      return;
    }
    if (locVal.length !== enVal.length) {
      errs.push(
        `${path}: array length ${locVal.length} ≠ English ${enVal.length} ` +
          `(i18next replaces arrays — missing items would vanish)`,
      );
    }
    const n = Math.min(enVal.length, locVal.length);
    for (let i = 0; i < n; i++)
      checkShape(enVal[i], locVal[i], `${path}[${i}]`, errs);
  } else if (enVal && typeof enVal === "object") {
    if (!locVal || typeof locVal !== "object" || Array.isArray(locVal)) {
      errs.push(`${path}: expected an object`);
      return;
    }
    for (const k of Object.keys(enVal))
      checkShape(enVal[k], locVal[k], `${path}.${k}`, errs);
  } else if (typeof enVal === "string" && typeof locVal === "string") {
    if (markup(enVal) !== markup(locVal))
      errs.push(
        `${path}: placeholder/markup mismatch — English has "${markup(enVal)}", locale has "${markup(locVal)}"`,
      );
  }
}

let hardErrors = 0;
let strictFailures = 0;
let warnings = 0;

// ---- Load + validate the canonical English set ------------------------------
const namespaces = readdirSync(join(LOCALES_DIR, SOURCE)).filter((f) =>
  f.endsWith(".json"),
);
const enFlat = {};
const enData = {};
for (const ns of namespaces) {
  const { data, error } = loadJson(join(LOCALES_DIR, SOURCE, ns));
  if (error) {
    console.error(`✗ en/${ns}: invalid JSON — ${error}`);
    hardErrors++;
    continue;
  }
  enData[ns] = data;
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
console.log(`Canonical en: ${namespaces.length} namespaces, ${enTotal} keys\n`);

// ---- Compare each target locale ---------------------------------------------
for (const target of TARGETS) {
  const dir = join(LOCALES_DIR, target);
  let translated = 0;
  let missing = 0;
  let extra = 0;
  let empty = 0;
  const localeWarnings = [];

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
    const nsBase = ns.replace(/\.json$/, "");

    for (const k of enKeys) {
      if (!(k in flat)) {
        missing++;
      } else if (flat[k] === "") {
        empty++;
        hardErrors++;
        console.error(`✗ ${target}/${ns}: empty value at "${k}"`);
      } else {
        translated++;
        if (
          isOriginalLanguage(nsBase, k) &&
          flat[k] !== enFlat[ns][k]
        ) {
          hardErrors++;
          console.error(
            `✗ ${target}/${ns}: original-language testimonial changed at "${k}"`,
          );
        }
        // English-identical warning (skip legal + proper nouns).
        if (
          typeof flat[k] === "string" &&
          flat[k] === enFlat[ns][k] &&
          !isEnglishOnly(nsBase, k) &&
          !isOriginalLanguage(nsBase, k) &&
          !PROPER_NOUN_VALUES.has(flat[k])
        ) {
          localeWarnings.push(`${ns} → "${k}" identical to English: "${flat[k]}"`);
          warnings++;
        }
      }
    }
    for (const k of Object.keys(flat)) {
      if (!enKeySet.has(k)) {
        extra++;
        hardErrors++;
        console.error(`✗ ${target}/${ns}: extra key "${k}" not present in en`);
      }
    }

    // Array/markup shape (placeholders, tag parity, array length) — only where
    // the locale supplies a value, so untranslated keys stay a benign fallback.
    const shapeErrs = [];
    checkShape(enData[nsBase], data, nsBase, shapeErrs);
    for (const e of shapeErrs) {
      console.error(`✗ ${target}/${e}`);
      hardErrors++;
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
  if (localeWarnings.length) {
    for (const w of localeWarnings.slice(0, 40))
      console.log(`  ⚠ ${target}/${w}`);
    if (localeWarnings.length > 40)
      console.log(`  ⚠ …and ${localeWarnings.length - 40} more identical value(s)`);
  }
}

console.log("");
if (hardErrors) {
  console.error(`i18n:check FAILED — ${hardErrors} structural error(s).`);
  process.exit(1);
}
if (STRICT && (strictFailures || warnings)) {
  console.error(
    `i18n:check --strict FAILED — ${strictFailures} untranslated key(s), ` +
      `${warnings} English-identical value(s).`,
  );
  process.exit(1);
}
console.log(
  warnings
    ? `i18n:check passed with ${warnings} warning(s) (English-identical values — review above).`
    : "i18n:check passed.",
);
process.exit(0);
