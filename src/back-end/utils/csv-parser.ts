import { parse } from 'csv-parse/sync';
import type { Genre } from '../types/MoviesTypes.ts';

/**
 * Validates that the headers contain exactly "id" and "name".
 * @param headers Array of header names found in the CSV.
 */
function validateHeaders(headers: string[] | undefined): void {
  if (!headers || headers.length !== 2) {
    throw new Error(
      `Invalid CSV headers: expected exactly "id" and "name", got [${headers?.join(', ') ?? ''}].`,
    );
  }

  const normalized = headers.map((header) => header.toLowerCase());
  if (
    !normalized.includes('id') ||
    !normalized.includes('name') ||
    normalized[0] === normalized[1]
  ) {
    throw new Error(
      `Invalid CSV headers: expected "id" and "name", got [${headers.join(', ')}].`,
    );
  }
}

/**
 * Parses a genres CSV string into an array of validated Genre objects.
 *
 * Requirements:
 * - Exactly two columns: "id" and "name" (case-insensitive, any order).
 * - "id" must be a positive safe integer.
 * - "name" must be a non-empty trimmed string.
 * - Supports UTF-8 BOM, CRLF/LF, quoted fields and escaped quotes.
 * - Skips empty lines.
 *
 * @param csvContent Raw CSV text content.
 * @returns Array of parsed Genre objects.
 * @throws Error if headers, structure or values are invalid.
 */
export function parseGenresCsv(csvContent: string): Genre[] {
  let records: Record<string, string>[];

  try {
    records = parse(csvContent, {
      columns: (headers: string[]) =>
        headers.map((header) => header.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false,
    });
  } catch (error) {
    throw new Error(
      `Invalid CSV format: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const firstRecord = records[0];
  if (!firstRecord) {
    const rawHeaders = csvContent.replace(/^\uFEFF/, '').trim();
    if (!rawHeaders) {
      throw new Error('CSV file is empty: missing headers.');
    }
    const headerRow = parse(csvContent, {
      bom: true,
      trim: true,
    })[0] as string[] | undefined;

    validateHeaders(headerRow);
    return [];
  }

  const columns = Object.keys(firstRecord);
  validateHeaders(columns);

  return records.map((record, index) => {
    const rawId = record['id'];
    const rawName = record['name'];

    const idNumber = Number(rawId);
    if (
      !rawId ||
      !Number.isInteger(idNumber) ||
      idNumber <= 0 ||
      !Number.isSafeInteger(idNumber)
    ) {
      throw new Error(
        `Invalid genre id "${rawId}" at line ${index + 2}: must be a positive integer.`,
      );
    }

    if (!rawName || rawName.trim().length === 0) {
      throw new Error(
        `Empty genre name at line ${index + 2}: name must not be empty.`,
      );
    }

    return {
      id: idNumber,
      name: rawName.trim(),
    };
  });
}
