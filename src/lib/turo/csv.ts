/**
 * Minimal RFC 4180 CSV reader: comma-separated, fields optionally wrapped in
 * double quotes, "" escapes a quote, quoted fields may contain commas and
 * newlines. Handles CRLF/LF line endings and a leading UTF-8 BOM. Blank lines
 * are skipped.
 */
export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    if (!(row.length === 1 && row[0].trim() === "")) rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === ",") {
      endField();
    } else if (ch === "\n" || ch === "\r") {
      endRow();
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
    } else {
      field += ch;
    }
    i += 1;
  }
  if (quoted) throw new Error("The file ends inside a quoted field. It may be cut off or not a CSV export.");
  if (field !== "" || row.length > 0) endRow();
  return rows;
}
