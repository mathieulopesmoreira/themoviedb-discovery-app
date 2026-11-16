import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TmdbMoviesRawResponse } from '../types/MoviesTypes.ts';
import { tmdbAccessToken } from '../utils/config.ts';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants.ts';
import { registerDiscoverApi } from './discover-api.ts';

const { toSupportedMovieMock } = vi.hoisted(() => ({
  toSupportedMovieMock: vi.fn(),
}));

vi.mock('../utils/converter.ts', () => ({
  toSupportedMovie: toSupportedMovieMock,
}));

vi.mock('../utils/config.ts', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getHandler(path: string): RouteHandler {
  const handler = handlers.get(path);
  if (!handler) throw new Error(`No handler registered for ${path}`);
  return handler as RouteHandler;
}

function createResponse() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function tmdbResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe('discover API', () => {
  beforeEach(() => {
    handlers.clear();
    registerDiscoverApi(app);
    toSupportedMovieMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('GET /api/discover/movies', () => {
    it('discovers movies for a valid year using default language, page and region', async () => {
      const rawMovie = { id: 10, adult: false, video: false };
      const rawData: TmdbMoviesRawResponse = {
        page: 1,
        results: [rawMovie as TmdbMoviesRawResponse['results'][number]],
        total_pages: 5,
        total_results: 100,
      };
      const supportedMovie = { id: 10, title: 'Film 2020' };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      toSupportedMovieMock.mockReturnValue(supportedMovie);
      const response = createResponse();

      await getHandler('/api/discover/movies')(
        { query: { year: '2020' } } as unknown as Request,
        response,
        vi.fn(),
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${tmdbAccessToken}`,
          }),
        }),
      );
      expect(response.json).toHaveBeenCalledWith({
        page: 1,
        results: [supportedMovie],
        total_pages: 5,
        total_results: 100,
      });
    });

    it('forwards non-empty custom language, page and region and falls back when empty or non-string', async () => {
      const rawData: TmdbMoviesRawResponse = {
        page: 2,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse(rawData))
        .mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);

      const response1 = createResponse();
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2021',
            language: 'en-US',
            page: '2',
            region: 'US',
          },
        } as unknown as Request,
        response1,
        vi.fn(),
      );

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2021&language=en-US&page=2&region=US',
        expect.any(Object),
      );
      expect(response1.json).toHaveBeenCalledWith({
        page: 2,
        results: [],
        total_pages: 0,
        total_results: 0,
      });

      const response2 = createResponse();
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2021',
            language: '   ',
            page: ['2'],
            region: '',
          },
        } as unknown as Request,
        response2,
        vi.fn(),
      );

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        `https://api.themoviedb.org/3/discover/movie?primary_release_year=2021&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.any(Object),
      );
    });

    it('returns HTTP 400 without calling TMDB when year is missing or invalid', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const invalidQueries = [
        {},
        { year: '' },
        { year: '999' },
        { year: '0999' },
        { year: '10000' },
        { year: 'abcd' },
        { year: ['2020', '2021'] },
        { year: { value: '2020' } },
      ];

      for (const query of invalidQueries) {
        const response = createResponse();
        await getHandler('/api/discover/movies')(
          { query } as unknown as Request,
          response,
          vi.fn(),
        );

        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
          error: expect.stringContaining('year'),
        });
      }

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs errors and returns HTTP 500 on TMDB HTTP, network or JSON parsing failures', async () => {
      const jsonFailureResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValueOnce(new SyntaxError('Invalid JSON')),
      } as unknown as Response;

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 502))
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockResolvedValueOnce(jsonFailureResponse);
      vi.stubGlobal('fetch', fetchMock);
      const errorSpy = vi.spyOn(console, 'error');

      for (let i = 0; i < 3; i += 1) {
        const response = createResponse();
        await getHandler('/api/discover/movies')(
          { query: { year: '2020' } } as unknown as Request,
          response,
          vi.fn(),
        );

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to discover movies',
        });
      }

      expect(errorSpy).toHaveBeenCalledTimes(3);
    });
  });
});
