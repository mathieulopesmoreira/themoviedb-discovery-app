import { parse } from 'csv-parse/sync';
import type { Genre } from '../types/MoviesTypes.ts';

/**
 * Validates that the headers contain exactly "id" and "name".
 * @param headers Array of header names found in the CSV.
 */
function validateHeaders(headers: string[]): string[] {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  if (
    normalized.length !== 2 ||
    !normalized.includes('id') ||
    !normalized.includes('name') ||
    normalized[0] === normalized[1]
  ) {
    throw new Error(
      `Invalid CSV headers: expected exactly "id" and "name", got [${headers.join(', ')}].`,
    );
  }
  return normalized;
}

/**
 * Parses a genres CSV string into an array of validated Genre objects.
 *
 * @param csvContent Raw CSV text content.
 * @returns Array of parsed Genre objects.
 * @throws Error if headers, structure or values are invalid.
 */
export function parseGenresCsv(csvContent: string): Genre[] {
  const trimmedContent = csvContent.replace(/^\uFEFF/, '').trim();
  if (!trimmedContent) {
    throw new Error('CSV file is empty: missing headers.');
  }

  let records: Record<string, string>[];

  try {
    records = parse(csvContent, {
      columns: (headers: string[]) => validateHeaders(headers),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false,
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message.startsWith('Invalid CSV headers:')) {
      throw error;
    }
    throw new Error(`Invalid CSV format: ${message}`);
  }

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
