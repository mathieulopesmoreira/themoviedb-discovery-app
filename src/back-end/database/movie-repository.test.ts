import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema.ts';
import {
  findMovieById,
  listMovies,
  upsertMovies,
  type DatabaseMovie,
} from './movie-repository.ts';

describe('movie-repository.ts', () => {
  let database: DatabaseSync;

  const sampleMovie: DatabaseMovie = {
    id: 1,
    title: 'Inception',
    original_title: 'Inception',
    original_language: 'en',
    overview: 'A mind-bending thriller',
    release_date: '2010-07-16',
    popularity: 82.5,
    vote_average: 8.8,
    vote_count: 34000,
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    runtime_minutes: 148,
    budget: 160000000,
    revenue: 836800000,
    collected_at: '2026-01-01T00:00:00Z',
    genre_ids: [28, 878],
    country_codes: ['US', 'GB'],
  };

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    initializeSchema(database);

    database.exec(`
      INSERT INTO genres (id, name) VALUES (28, 'Action'), (878, 'Sci-Fi'), (35, 'Comedy');
      INSERT INTO countries (code, name) VALUES ('US', 'United States'), ('GB', 'United Kingdom'), ('FR', 'France');
    `);
  });

  afterEach(() => {
    database.close();
  });

  describe('findMovieById', () => {
    it('returns undefined when the movie does not exist', () => {
      expect(findMovieById(database, 999)).toBeUndefined();
    });

    it('returns the movie with its associated genres and countries', () => {
      upsertMovies(database, [sampleMovie]);

      const movie = findMovieById(database, 1);
      expect(movie).toBeDefined();
      expect(movie?.title).toBe('Inception');
      expect(movie?.release_year).toBe(2010);
      expect(movie?.genre_ids).toEqual([28, 878]);
      expect(movie?.country_codes).toEqual(['GB', 'US']);
    });
  });

  describe('listMovies', () => {
    it('returns an empty list when no movies exist', () => {
      expect(listMovies(database)).toEqual([]);
    });

    it('returns movies sorted by ascending id with their associations', () => {
      const movie2: DatabaseMovie = {
        ...sampleMovie,
        id: 2,
        title: 'Interstellar',
        release_date: '2014-11-07',
        genre_ids: [878],
        country_codes: ['US'],
      };

      upsertMovies(database, [movie2, sampleMovie]);

      const movies = listMovies(database);
      expect(movies).toHaveLength(2);
      expect(movies[0]?.id).toBe(1);
      expect(movies[0]?.release_year).toBe(2010);
      expect(movies[1]?.id).toBe(2);
      expect(movies[1]?.release_year).toBe(2014);
    });
  });

  describe('upsertMovies', () => {
    it('does not modify existing data when given an empty iterable', () => {
      upsertMovies(database, [sampleMovie]);
      upsertMovies(database, []);

      expect(listMovies(database)).toHaveLength(1);
    });

    it('updates existing movie information without creating duplicates', () => {
      upsertMovies(database, [sampleMovie]);

      const updatedMovie: DatabaseMovie = {
        ...sampleMovie,
        title: 'Inception (Updated)',
        overview: 'Updated overview',
        genre_ids: [35],
        country_codes: ['FR'],
      };

      upsertMovies(database, [updatedMovie]);

      const movies = listMovies(database);
      expect(movies).toHaveLength(1);
      expect(movies[0]?.title).toBe('Inception (Updated)');
      expect(movies[0]?.overview).toBe('Updated overview');
      expect(movies[0]?.genre_ids).toEqual([35]);
      expect(movies[0]?.country_codes).toEqual(['FR']);
    });

    it('handles nullable fields gracefully and preserves nulls', () => {
      const minimalMovie: DatabaseMovie = {
        id: 3,
        title: 'Minimal Movie',
        original_title: 'Minimal Movie',
        original_language: 'fr',
        overview: 'No details',
        release_date: null,
        popularity: null,
        vote_average: null,
        vote_count: null,
        poster_path: null,
        backdrop_path: null,
        runtime_minutes: null,
        budget: null,
        revenue: null,
        collected_at: '2026-01-01T00:00:00Z',
      };

      upsertMovies(database, [minimalMovie]);

      const movie = findMovieById(database, 3);
      expect(movie?.release_year).toBeNull();
      expect(movie?.genre_ids).toEqual([]);
      expect(movie?.country_codes).toEqual([]);
    });

    it('enforces foreign key constraints and rolls back on failure', () => {
      const invalidMovie: DatabaseMovie = {
        ...sampleMovie,
        id: 4,
        genre_ids: [9999], // Genre does not exist in genres table
      };

      expect(() => upsertMovies(database, [invalidMovie])).toThrow(
        /FOREIGN KEY constraint failed/,
      );

      expect(findMovieById(database, 4)).toBeUndefined();
    });
  });
});
