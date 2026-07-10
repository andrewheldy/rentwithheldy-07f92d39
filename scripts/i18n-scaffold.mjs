// Ensures every non-English locale has a JSON file for each English namespace.
// Missing files are created as `{}` — a full English fallback the translation
// team fills in Phase 2. Existing files are never overwritten.
//
//   node scripts/i18n-scaffold.mjs      (or: npm run i18n:scaffold)
import { readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(here, "../src/i18n/locales");
const SOURCE = "en";
const TARGETS = ["es", "fr", "pt", "he"];

const namespaces = readdirSync(join(LOCALES_DIR, SOURCE)).filter((f) =>
  f.endsWith(".json"),
);

let created = 0;
for (const target of TARGETS) {
  const dir = join(LOCALES_DIR, target);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  for (const ns of namespaces) {
    const file = join(dir, ns);
    if (!existsSync(file)) {
      writeFileSync(file, "{}\n");
      created++;
      console.log(`  + ${target}/${ns}`);
    }
  }
}

console.log(
  created
    ? `\nScaffolded ${created} empty namespace file(s). They fall back to English until translated.`
    : "All locale namespace files already present.",
);
