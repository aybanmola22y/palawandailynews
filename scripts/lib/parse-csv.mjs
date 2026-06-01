import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { normalizeRecord } from "./article-import.mjs";

/**
 * Parse a CSV export into row objects with normalized header keys.
 */
export async function loadCsvRows(filePath) {
  const raw = await readFile(filePath, "utf8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  });

  if (!records.length) {
    throw new Error(`No data rows in ${filePath}`);
  }

  return records.map((record) => ({
    ...record,
    _normalized: normalizeRecord(record),
  }));
}
