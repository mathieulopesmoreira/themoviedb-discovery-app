import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listCountries } from '../database/country-repository.ts';
import { listGenres } from '../database/genre-repository.ts';
import { findMovieById, listMovies } from '../database/movie-repository.ts';
import { initializeSchema } from '../database/schema.ts';
import {
  syncCountriesFromApi,
  syncGenresFromApi,
  syncMovieById,
  syncMoviesByYear,
  syncPopularMovies,
} from './movie-sync-service.ts';

describe('movie-sync-service.ts', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    initializeSchema(db);
  });

  afterEach(() => {
    db.close();
    vi.unstubAllGlobals();
  });

  describe('syncGenresFromApi', () => {
    it('fetches genres from API and upserts them into database', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          genres: [
            { id: 28, name: 'Action' },
            { id: 18, name: 'Drame' },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const genres = await syncGenresFromApi(db);

      expect(genres).toHaveLength(2);
      expect(listGenres(db)).toEqual([
        { id: 18, name: 'Drame' },
        { id: 28, name: 'Action' },
      ]);
    });

    it('handles empty genre list from API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ genres: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const genres = await syncGenresFromApi(db);

      expect(genres).toEqual([]);
      expect(listGenres(db)).toEqual([]);
    });

    it('throws error when API response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(syncGenresFromApi(db)).rejects.toThrow(
        /Failed to fetch genres: 401/,
      );
    });
  });

  describe('syncCountriesFromApi', () => {
    it('fetches countries configuration and upserts them into database', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { iso_3166_1: 'FR', english_name: 'France' },
          { iso_3166_1: 'US', english_name: 'United States' },
        ],
      });
      vi.stubGlobal('fetch', mockFetch);

      const countries = await syncCountriesFromApi(db);

      expect(countries).toHaveLength(2);
      expect(listCountries(db)).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);
    });

    it('handles empty country list from API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });
      vi.stubGlobal('fetch', mockFetch);

      const countries = await syncCountriesFromApi(db);

      expect(countries).toEqual([]);
      expect(listCountries(db)).toEqual([]);
    });

    it('throws error when API response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(syncCountriesFromApi(db)).rejects.toThrow(
        /Failed to fetch countries: 500/,
      );
    });
  });

  describe('syncMovieById', () => {
    it('fetches movie details, syncs genres/countries and stores full movie', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 550,
          title: 'Fight Club',
          original_title: 'Fight Club',
          original_language: 'en',
          overview: 'An insomniac office worker...',
          release_date: '1999-10-15',
          popularity: 63.869,
          vote_average: 8.433,
          vote_count: 26280,
          poster_path: '/poster.jpg',
          backdrop_path: '/backdrop.jpg',
          runtime: 139,
          budget: 63000000,
          revenue: 100853753,
          genres: [{ id: 18, name: 'Drama' }],
          production_countries: [
            { iso_3166_1: 'US', name: 'United States of America' },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const movie = await syncMovieById(db, 550);

      expect(movie.id).toBe(550);
      expect(movie.title).toBe('Fight Club');
      expect(movie.runtime_minutes).toBe(139);

      const saved = findMovieById(db, 550);
      expect(saved).toBeDefined();
      expect(saved?.genre_ids).toEqual([18]);
      expect(saved?.country_codes).toEqual(['US']);
      expect(listGenres(db)).toEqual([{ id: 18, name: 'Drama' }]);
      expect(listCountries(db)).toEqual([
        { code: 'US', name: 'United States of America' },
      ]);
    });

    it('handles nullable defaults when original fields are missing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 1,
          title: 'Minimal Movie',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const movie = await syncMovieById(db, 1);

      expect(movie.original_title).toBe('Minimal Movie');
      expect(movie.original_language).toBe('en');
      expect(movie.overview).toBe('');
      expect(movie.release_date).toBeNull();
      expect(movie.popularity).toBeNull();
    });

    it('throws error when fetching movie by ID fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(syncMovieById(db, 999)).rejects.toThrow(
        /Failed to fetch movie details for ID 999: 404/,
      );
    });
  });

  describe('syncMoviesByYear', () => {
    it('discovers movies by year and saves them into the database', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          page: 1,
          total_pages: 1,
          total_results: 2,
          results: [
            {
              id: 101,
              title: 'Year Movie',
              original_title: 'Year Movie',
              original_language: 'en',
              overview: 'Overview',
              release_date: '2022-05-01',
              popularity: 12.5,
              vote_average: 7.1,
              vote_count: 50,
              poster_path: '/p.jpg',
              backdrop_path: '/b.jpg',
              genre_ids: [],
            },
            {
              id: 102,
              title: 'Year Movie 2',
              original_title: 'Year Movie 2',
              original_language: 'en',
              overview: 'Overview 2',
              release_date: '',
              popularity: 5.0,
              vote_average: 6.0,
              vote_count: 10,
              poster_path: null,
              backdrop_path: null,
              genre_ids: [],
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const movies = await syncMoviesByYear(db, 2022, 2);

      expect(movies).toHaveLength(2);
      expect(movies[1].release_date).toBeNull();
      expect(listMovies(db)).toHaveLength(2);
      expect(listMovies(db)[0].id).toBe(101);
    });

    it('throws error when discover request fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(syncMoviesByYear(db, 2022)).rejects.toThrow(
        /Failed to discover movies for year 2022: 500/,
      );
    });

    it('handles empty results from discover', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ page: 1, results: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const movies = await syncMoviesByYear(db, 1900);

      expect(movies).toEqual([]);
      expect(listMovies(db)).toEqual([]);
    });
  });

  describe('syncPopularMovies', () => {
    it('fetches popular movies and stores them in database', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          page: 1,
          total_pages: 1,
          total_results: 2,
          results: [
            {
              id: 202,
              title: 'Popular Movie',
              original_title: 'Popular Movie',
              original_language: 'fr',
              overview: 'Pop Overview',
              release_date: '2023-01-01',
              popularity: 100,
              vote_average: 8.0,
              vote_count: 500,
              poster_path: null,
              backdrop_path: null,
              genre_ids: [],
            },
            {
              id: 203,
              title: 'Popular Movie 2',
              original_title: 'Popular Movie 2',
              original_language: 'fr',
              overview: 'Pop Overview 2',
              release_date: '',
              popularity: 90,
              vote_average: 7.5,
              vote_count: 300,
              poster_path: null,
              backdrop_path: null,
              genre_ids: [],
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const movies = await syncPopularMovies(db, 2);

      expect(movies).toHaveLength(2);
      expect(movies[1].release_date).toBeNull();
      expect(listMovies(db)[0].id).toBe(202);
    });

    it('throws error when popular request fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(syncPopularMovies(db)).rejects.toThrow(
        /Failed to fetch popular movies: 403/,
      );
    });

    it('handles empty results for popular movies', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ page: 1, results: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const movies = await syncPopularMovies(db);

      expect(movies).toEqual([]);
      expect(listMovies(db)).toEqual([]);
    });
  });
});
