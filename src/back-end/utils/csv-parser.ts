import { parse } from 'csv-parse/sync';
import type { DatabaseMovie, Genre } from '../types/MoviesTypes.ts';

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

const REQUIRED_MOVIE_HEADERS = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime',
  'budget',
  'revenue',
  'genres',
  'production_countries',
];

/**
 * Parses a movies CSV string into an array of validated DatabaseMovie objects.
 * @param csvContent Raw CSV text content.
 * @returns Array of parsed DatabaseMovie objects.
 */
export function parseMoviesCsv(csvContent: string): DatabaseMovie[] {
  const trimmedContent = csvContent.replace(/^\uFEFF/, '').trim();
  if (!trimmedContent) {
    throw new Error('CSV file is empty: missing headers.');
  }

  let records: Record<string, string>[];

  try {
    records = parse(csvContent, {
      columns: (headers: string[]) => {
        const normalized = headers.map((h) => h.trim().toLowerCase());
        const hasAllHeaders = REQUIRED_MOVIE_HEADERS.every((req) =>
          normalized.includes(req),
        );
        if (
          !hasAllHeaders ||
          normalized.length !== REQUIRED_MOVIE_HEADERS.length
        ) {
          throw new Error('Invalid CSV headers for movies.');
        }
        return normalized;
      },
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false,
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message.startsWith('Invalid CSV headers')) {
      throw error;
    }
    throw new Error(`Invalid CSV format: ${message}`);
  }

  const collectedAt = new Date().toISOString();

  return records.map((record, index) => {
    const rawId = record['id'];
    const idNumber = Number(rawId);
    if (!rawId || !Number.isInteger(idNumber) || idNumber <= 0) {
      throw new Error(
        `Invalid movie id "${rawId}" at line ${index + 2}: must be a positive integer.`,
      );
    }

    const title = record['title']?.trim();
    if (!title) {
      throw new Error(`Missing movie title at line ${index + 2}.`);
    }

    const parseNullableNumber = (val?: string): number | null => {
      if (!val || val.trim().length === 0) return null;
      const num = Number(val);
      return Number.isNaN(num) ? null : num;
    };

    let genreIds: number[] = [];
    const rawGenres = record['genres']?.trim();
    if (rawGenres) {
      try {
        const parsed = JSON.parse(rawGenres) as unknown[];
        genreIds = Array.isArray(parsed)
          ? parsed.map(Number).filter((n) => Number.isInteger(n) && n > 0)
          : [];
      } catch {
        genreIds = [];
      }
    }

    let countryCodes: string[] = [];
    const rawCountries = record['production_countries']?.trim();
    if (rawCountries) {
      try {
        const parsed = JSON.parse(rawCountries) as Array<{
          iso_3166_1?: string;
        }>;
        countryCodes = Array.isArray(parsed)
          ? parsed
              .map((c) => c?.iso_3166_1)
              .filter(
                (code): code is string =>
                  typeof code === 'string' && /^[A-Z]{2}$/.test(code),
              )
          : [];
      } catch {
        countryCodes = [];
      }
    }

    return {
      id: idNumber,
      title,
      original_title: record['original_title']?.trim() || title,
      original_language: record['original_language']?.trim() || 'en',
      overview: record['overview']?.trim() || '',
      release_date: record['release_date']?.trim() || null,
      popularity: parseNullableNumber(record['popularity']),
      vote_average: parseNullableNumber(record['vote_average']),
      vote_count: parseNullableNumber(record['vote_count']),
      poster_path: record['poster_path']?.trim() || null,
      backdrop_path: record['backdrop_path']?.trim() || null,
      runtime_minutes: parseNullableNumber(record['runtime']),
      budget: parseNullableNumber(record['budget']),
      revenue: parseNullableNumber(record['revenue']),
      collected_at: collectedAt,
      genre_ids: genreIds,
      country_codes: countryCodes,
    };
  });
}
