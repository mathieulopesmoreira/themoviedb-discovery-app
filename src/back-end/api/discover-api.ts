import type { Express, Request, Response } from 'express';
import type {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes.ts';
import { tmdbAccessToken } from '../utils/config.ts';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants.ts';
import { toSupportedMovie } from '../utils/converter.ts';

/**
 * Resolves a string query parameter or falls back to the provided default value.
 * @param value Raw query parameter value from Express.
 * @param defaultValue Default string value when missing or empty.
 * @returns The trimmed string parameter or default value.
 */
function resolveStringParam(value: unknown, defaultValue: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : defaultValue;
}

/**
 * Registers the TMDB Discover API route on the Express application.
 * @param app The Express application instance.
 */
export function registerDiscoverApi(app: Express): void {
  app.get('/api/discover/movies', async (req: Request, res: Response) => {
    const rawYear = req.query.year;

    if (typeof rawYear !== 'string' || !/^[1-9]\d{3}$/.test(rawYear)) {
      res.status(400).json({
        error:
          'Invalid or missing year parameter: must be a four-digit year between 1000 and 9999',
      });
      return;
    }

    const queryParams = new URLSearchParams({
      primary_release_year: rawYear,
      language: resolveStringParam(req.query.language, DEFAULT_LANGUAGE),
      page: resolveStringParam(req.query.page, String(DEFAULT_PAGE)),
      region: resolveStringParam(req.query.region, DEFAULT_REGION),
    });

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${tmdbAccessToken}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `TMDB Discover request failed with status ${response.status}`,
        );
      }

      const rawData = (await response.json()) as TmdbMoviesRawResponse;

      const data: MoviesApiResponse = {
        page: rawData.page,
        results: rawData.results.map(toSupportedMovie),
        total_pages: rawData.total_pages,
        total_results: rawData.total_results,
      };

      res.json(data);
    } catch (error) {
      console.error('Error discovering movies:', error);
      res.status(500).json({ error: 'Failed to discover movies' });
    }
  });
}
