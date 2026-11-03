import type { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/MoviesTypes.ts';

export type { Genre };

/**
 * Finds a genre by its unique identifier.
 * @param database The SQLite database connection.
 * @param id The genre identifier.
 * @returns The matching genre or `undefined` if not found.
 */
export function findGenreById(
  database: DatabaseSync,
  id: number,
): Genre | undefined {
  const row = database
    .prepare('SELECT id, name FROM genres WHERE id = ?')
    .get(id) as Genre | undefined;
  return row ? { id: row.id, name: row.name } : undefined;
}

/**
 * Lists all genres ordered by ascending identifier.
 * @param database The SQLite database connection.
 * @returns The list of genres sorted by `id` ascending.
 */
export function listGenres(database: DatabaseSync): Genre[] {
  const rows = database
    .prepare('SELECT id, name FROM genres ORDER BY id ASC')
    .all() as Genre[];
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

/**
 * Inserts or updates a collection of genres in the database.
 * @param database The SQLite database connection.
 * @param genres An iterable of genres to insert or update.
 */
export function upsertGenres(
  database: DatabaseSync,
  genres: Iterable<Genre>,
): void {
  const statement = database.prepare(`
    INSERT INTO genres (id, name)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name
  `);

  database.exec('BEGIN TRANSACTION;');
  try {
    for (const genre of genres) {
      statement.run(genre.id, genre.name);
    }
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}
