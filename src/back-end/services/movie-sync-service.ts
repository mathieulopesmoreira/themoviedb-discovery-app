import type { DatabaseSync } from 'node:sqlite';
import { upsertCountries } from '../database/country-repository.ts';
import { upsertGenres } from '../database/genre-repository.ts';
import { upsertMovies } from '../database/movie-repository.ts';
import type {
  Country,
  DatabaseMovie,
  Genre,
  TmdbMovieDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes.ts';
import { tmdbAccessToken } from '../utils/config.ts';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getApiHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${tmdbAccessToken}`,
    'Content-Type': 'application/json;charset=utf-8',
  };
}

export interface TmdbDetailedMovieResponse extends TmdbMovieDetails {
  runtime?: number | null;
  budget?: number | null;
  revenue?: number | null;
  production_countries?: Array<{
    iso_3166_1: string;
    name: string;
  }>;
}

export async function syncGenresFromApi(
  database: DatabaseSync,
): Promise<Genre[]> {
  const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch genres: ${response.status}`);
  }

  const data = (await response.json()) as { genres: Genre[] };
  const genres = data.genres;
  if (genres.length > 0) {
    upsertGenres(database, genres);
  }
  return genres;
}

export async function syncCountriesFromApi(
  database: DatabaseSync,
): Promise<Country[]> {
  const response = await fetch(`${TMDB_BASE_URL}/configuration/countries`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    iso_3166_1: string;
    english_name: string;
  }>;

  const countries: Country[] = data.map((c) => ({
    code: c.iso_3166_1,
    name: c.english_name,
  }));

  if (countries.length > 0) {
    upsertCountries(database, countries);
  }
  return countries;
}

export async function syncMovieById(
  database: DatabaseSync,
  movieId: number,
): Promise<DatabaseMovie> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch movie details for ID ${movieId}: ${response.status}`,
    );
  }

  const data = (await response.json()) as TmdbDetailedMovieResponse;

  const genres: Genre[] = data.genres ?? [];
  if (genres.length > 0) {
    upsertGenres(database, genres);
  }

  const countries: Country[] = (data.production_countries ?? []).map((c) => ({
    code: c.iso_3166_1,
    name: c.name,
  }));
  if (countries.length > 0) {
    upsertCountries(database, countries);
  }

  const movie: DatabaseMovie = {
    id: data.id,
    title: data.title,
    original_title: data.original_title ?? data.title,
    original_language: data.original_language ?? 'en',
    overview: data.overview ?? '',
    release_date: data.release_date ?? null,
    popularity: data.popularity ?? null,
    vote_average: data.vote_average ?? null,
    vote_count: data.vote_count ?? null,
    poster_path: data.poster_path ?? null,
    backdrop_path: data.backdrop_path ?? null,
    runtime_minutes: data.runtime ?? null,
    budget: data.budget ?? null,
    revenue: data.revenue ?? null,
    collected_at: new Date().toISOString(),
    genre_ids: genres.map((g) => g.id),
    country_codes: countries.map((c) => c.code),
  };

  upsertMovies(database, [movie]);
  return movie;
}

export async function syncMoviesByYear(
  database: DatabaseSync,
  year: number,
  page = 1,
): Promise<DatabaseMovie[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?primary_release_year=${year}&page=${page}`,
    {
      headers: getApiHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to discover movies for year ${year}: ${response.status}`,
    );
  }

  const data = (await response.json()) as TmdbMoviesRawResponse;
  const collectedAt = new Date().toISOString();

  const movies: DatabaseMovie[] = data.results.map((item) => ({
    id: item.id,
    title: item.title,
    original_title: item.original_title,
    original_language: item.original_language,
    overview: item.overview,
    release_date: item.release_date || null,
    popularity: item.popularity,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    runtime_minutes: null,
    budget: null,
    revenue: null,
    collected_at: collectedAt,
    genre_ids: item.genre_ids,
    country_codes: [],
  }));

  if (movies.length > 0) {
    upsertMovies(database, movies);
  }
  return movies;
}

export async function syncPopularMovies(
  database: DatabaseSync,
  page = 1,
): Promise<DatabaseMovie[]> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/popular?page=${page}`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch popular movies: ${response.status}`);
  }

  const data = (await response.json()) as TmdbMoviesRawResponse;
  const collectedAt = new Date().toISOString();

  const movies: DatabaseMovie[] = data.results.map((item) => ({
    id: item.id,
    title: item.title,
    original_title: item.original_title,
    original_language: item.original_language,
    overview: item.overview,
    release_date: item.release_date || null,
    popularity: item.popularity,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    runtime_minutes: null,
    budget: null,
    revenue: null,
    collected_at: collectedAt,
    genre_ids: item.genre_ids,
    country_codes: [],
  }));

  if (movies.length > 0) {
    upsertMovies(database, movies);
  }
  return movies;
}
