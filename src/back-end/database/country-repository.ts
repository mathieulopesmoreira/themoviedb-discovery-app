import type { DatabaseSync } from 'node:sqlite';
import type { Country } from '../types/MoviesTypes.ts';

export type { Country };

/**
 * Finds a country by its unique code.
 * @param database The SQLite database connection.
 * @param code The country code (e.g. 'FR', 'US').
 * @returns The matching country or `undefined` if not found.
 */
export function findCountryByCode(
  database: DatabaseSync,
  code: string,
): Country | undefined {
  const row = database
    .prepare('SELECT code, name FROM countries WHERE code = ?')
    .get(code) as Country | undefined;
  return row ? { code: row.code, name: row.name } : undefined;
}

/**
 * Lists all countries ordered by ascending code.
 * @param database The SQLite database connection.
 * @returns The list of countries sorted by `code` ascending.
 */
export function listCountries(database: DatabaseSync): Country[] {
  const rows = database
    .prepare('SELECT code, name FROM countries ORDER BY code ASC')
    .all() as Country[];
  return rows.map((row) => ({ code: row.code, name: row.name }));
}

/**
 * Inserts or updates a collection of countries in the database.
 * If a code already exists, updates the name without duplicate.
 * If a code appears multiple times in the iterable, the last name is kept.
 * @param database The SQLite database connection.
 * @param countries An iterable of countries to insert or update.
 */
export function upsertCountries(
  database: DatabaseSync,
  countries: Iterable<Country>,
): void {
  const statement = database.prepare(`
    INSERT INTO countries (code, name)
    VALUES (?, ?)
    ON CONFLICT(code) DO UPDATE SET name = excluded.name
  `);

  database.exec('BEGIN TRANSACTION;');
  try {
    for (const country of countries) {
      statement.run(country.code, country.name);
    }
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Deletes countries that are not associated with any movie in the production_countries table.
 * @param database The SQLite database connection.
 * @returns The number of unused countries deleted.
 */
export function cleanUnusedCountries(database: DatabaseSync): number {
  const result = database
    .prepare(
      'DELETE FROM countries WHERE code NOT IN (SELECT DISTINCT country_code FROM production_countries)',
    )
    .run();
  return Number(result.changes);
}
