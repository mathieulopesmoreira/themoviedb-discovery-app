import type { DatabaseSync } from 'node:sqlite';
import type { DatabaseMovie } from '../types/MoviesTypes.ts';

export type { DatabaseMovie };

interface MovieRow {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  release_date: string | null;
  release_year: number | null;
  popularity: number | null;
  vote_average: number | null;
  vote_count: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime_minutes: number | null;
  budget: number | null;
  revenue: number | null;
  collected_at: string;
}

/**
 * Hydrates movie rows with their associated genre IDs and production country codes.
 * @param database The SQLite database connection.
 * @param movie The raw movie row from the database.
 * @returns The fully hydrated DatabaseMovie object.
 */
function hydrateMovie(database: DatabaseSync, movie: MovieRow): DatabaseMovie {
  const genreRows = database
    .prepare(
      'SELECT genre_id FROM movie_genres WHERE movie_id = ? ORDER BY genre_id ASC',
    )
    .all(movie.id) as Array<{ genre_id: number }>;

  const countryRows = database
    .prepare(
      'SELECT country_code FROM production_countries WHERE movie_id = ? ORDER BY country_code ASC',
    )
    .all(movie.id) as Array<{ country_code: string }>;

  return {
    ...movie,
    genre_ids: genreRows.map((r) => r.genre_id),
    country_codes: countryRows.map((r) => r.country_code),
  };
}

/**
 * Finds a movie by its unique identifier.
 * @param database The SQLite database connection.
 * @param id The movie identifier.
 * @returns The matching movie with its genres and countries, or `undefined` if not found.
 */
export function findMovieById(
  database: DatabaseSync,
  id: number,
): DatabaseMovie | undefined {
  const row = database
    .prepare('SELECT * FROM movies WHERE id = ?')
    .get(id) as unknown as MovieRow | undefined;

  return row ? hydrateMovie(database, row) : undefined;
}

/**
 * Lists all movies ordered by ascending identifier.
 * @param database The SQLite database connection.
 * @returns Array of movies sorted by `id` ascending.
 */
export function listMovies(database: DatabaseSync): DatabaseMovie[] {
  const rows = database
    .prepare('SELECT * FROM movies ORDER BY id ASC')
    .all() as unknown as MovieRow[];

  return rows.map((row) => hydrateMovie(database, row));
}

/**
 * Inserts or updates a collection of movies in the database.
 * Also synchronizes movie_genres and production_countries if provided.
 * @param database The SQLite database connection.
 * @param movies An iterable of movies to insert or update.
 */
export function upsertMovies(
  database: DatabaseSync,
  movies: Iterable<DatabaseMovie>,
): void {
  const upsertMovieStmt = database.prepare(`
    INSERT INTO movies (
      id, title, original_title, original_language, overview,
      release_date, popularity, vote_average, vote_count,
      poster_path, backdrop_path, runtime_minutes, budget, revenue, collected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      original_title = excluded.original_title,
      original_language = excluded.original_language,
      overview = excluded.overview,
      release_date = excluded.release_date,
      popularity = excluded.popularity,
      vote_average = excluded.vote_average,
      vote_count = excluded.vote_count,
      poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path,
      runtime_minutes = excluded.runtime_minutes,
      budget = excluded.budget,
      revenue = excluded.revenue,
      collected_at = excluded.collected_at
  `);

  const deleteMovieGenresStmt = database.prepare(
    'DELETE FROM movie_genres WHERE movie_id = ?',
  );
  const insertMovieGenreStmt = database.prepare(
    'INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
  );

  const deleteMovieCountriesStmt = database.prepare(
    'DELETE FROM production_countries WHERE movie_id = ?',
  );
  const insertMovieCountryStmt = database.prepare(
    'INSERT OR IGNORE INTO production_countries (movie_id, country_code) VALUES (?, ?)',
  );

  database.exec('BEGIN TRANSACTION;');
  try {
    for (const movie of movies) {
      upsertMovieStmt.run(
        movie.id,
        movie.title,
        movie.original_title,
        movie.original_language,
        movie.overview,
        movie.release_date ?? null,
        movie.popularity ?? null,
        movie.vote_average ?? null,
        movie.vote_count ?? null,
        movie.poster_path ?? null,
        movie.backdrop_path ?? null,
        movie.runtime_minutes ?? null,
        movie.budget ?? null,
        movie.revenue ?? null,
        movie.collected_at,
      );

      if (movie.genre_ids !== undefined) {
        deleteMovieGenresStmt.run(movie.id);
        for (const genreId of movie.genre_ids) {
          insertMovieGenreStmt.run(movie.id, genreId);
        }
      }

      if (movie.country_codes !== undefined) {
        deleteMovieCountriesStmt.run(movie.id);
        for (const countryCode of movie.country_codes) {
          insertMovieCountryStmt.run(movie.id, countryCode);
        }
      }
    }
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}
