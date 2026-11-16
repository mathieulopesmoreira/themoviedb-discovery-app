import { describe, expect, it } from 'vitest';
import { parseGenresCsv, parseMoviesCsv } from './csv-parser.ts';

describe('csv-parser.ts', () => {
  describe('parseGenresCsv', () => {
    it('parses standard CSV with id,name headers', () => {
      const csv = 'id,name\n28,Action\n12,Aventure\n';
      expect(parseGenresCsv(csv)).toEqual([
        { id: 28, name: 'Action' },
        { id: 12, name: 'Aventure' },
      ]);
    });

    it('accepts headers in any order and case-insensitively', () => {
      const csv = '  NAME , ID \nComédie,35\nDrame,18';
      expect(parseGenresCsv(csv)).toEqual([
        { id: 35, name: 'Comédie' },
        { id: 18, name: 'Drame' },
      ]);
    });

    it('supports UTF-8 BOM, CRLF line endings, empty lines, commas in quotes and escaped quotes', () => {
      const csv =
        '\uFEFFid,name\r\n\r\n28,"Action, Aventure"\r\n35,"Comédie ""Noire"""\r\n\r\n';
      expect(parseGenresCsv(csv)).toEqual([
        { id: 28, name: 'Action, Aventure' },
        { id: 35, name: 'Comédie "Noire"' },
      ]);
    });

    it('returns an empty array when only valid headers are present', () => {
      expect(parseGenresCsv('id,name\n\n')).toEqual([]);
    });

    it('throws an explicit error when the CSV file is completely empty', () => {
      expect(() => parseGenresCsv('   \n  ')).toThrow(
        /CSV file is empty: missing headers/,
      );
    });

    it('throws an explicit error when headers are invalid or duplicated', () => {
      expect(() => parseGenresCsv('id,title\n28,Action')).toThrow(
        /Invalid CSV headers/,
      );
      expect(() => parseGenresCsv('id\n28')).toThrow(/Invalid CSV headers/);
      expect(() => parseGenresCsv('id,id\n28,28')).toThrow(
        /Invalid CSV headers/,
      );
      expect(() => parseGenresCsv('id,title\n')).toThrow(/Invalid CSV headers/);
    });

    it('throws an explicit error on malformed CSV quotes or column count', () => {
      expect(() => parseGenresCsv('id,name\n28,"Unclosed quote')).toThrow(
        /Invalid CSV format/,
      );
    });

    it('throws an explicit error when id is not a positive safe integer', () => {
      expect(() => parseGenresCsv('id,name\n0,Action')).toThrow(
        /Invalid genre id/,
      );
      expect(() => parseGenresCsv('id,name\n-5,Action')).toThrow(
        /Invalid genre id/,
      );
      expect(() => parseGenresCsv('id,name\nabc,Action')).toThrow(
        /Invalid genre id/,
      );
      expect(() => parseGenresCsv('id,name\n9007199254740992,Action')).toThrow(
        /Invalid genre id/,
      );
    });

    it('throws an explicit error when name is empty', () => {
      expect(() => parseGenresCsv('id,name\n28,   ')).toThrow(
        /Empty genre name/,
      );
    });
  });

  describe('parseMoviesCsv', () => {
    const headers = [
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
    const headerLine = headers.join(',');

    const makeCsv = (...rows: Array<Partial<Record<string, string>>>) => {
      const lines = rows.map((r) =>
        headers.map((h) => (r[h] !== undefined ? r[h] : '')).join(','),
      );
      return [headerLine, ...lines].join('\n');
    };

    it('parses a valid movies CSV with all fields', () => {
      const csv = `${headerLine}
550,Fight Club,Fight Club,en,"An insomniac office worker...",1999-10-15,63.869,8.433,26280,/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg,/hZkgoQYus5vegHoetLkCJzb17zJ.jpg,139,63000000,100853753,"[18,53]","[{""iso_3166_1"":""US"",""name"":""United States of America""}]"`;

      const movies = parseMoviesCsv(csv);
      expect(movies).toHaveLength(1);
      expect(movies[0]).toMatchObject({
        id: 550,
        title: 'Fight Club',
        original_title: 'Fight Club',
        original_language: 'en',
        overview: 'An insomniac office worker...',
        release_date: '1999-10-15',
        popularity: 63.869,
        vote_average: 8.433,
        vote_count: 26280,
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
        runtime_minutes: 139,
        budget: 63000000,
        revenue: 100853753,
        genre_ids: [18, 53],
        country_codes: ['US'],
      });
      expect(typeof movies[0].collected_at).toBe('string');
    });

    it('handles nullable and default values properly', () => {
      const csv = makeCsv({
        id: '1',
        title: 'Sample Movie',
      });
      const movies = parseMoviesCsv(csv);
      expect(movies).toHaveLength(1);
      expect(movies[0]).toMatchObject({
        id: 1,
        title: 'Sample Movie',
        original_title: 'Sample Movie',
        original_language: 'en',
        overview: '',
        release_date: null,
        popularity: null,
        vote_average: null,
        vote_count: null,
        poster_path: null,
        backdrop_path: null,
        runtime_minutes: null,
        budget: null,
        revenue: null,
        genre_ids: [],
        country_codes: [],
      });
    });

    it('handles invalid numbers, non-array json, and invalid country codes gracefully', () => {
      const csv = `${headerLine}
2,Edge Movie,Original,fr,Description,2020-01-01,notanumber,invalid,notacount,/poster.jpg,/backdrop.jpg,invalid_rt,invalid_b,invalid_r,"{""not"":""array""}","[{""iso_3166_1"":""INVALID""},{""iso_3166_1"":123},{}]"`;
      const movies = parseMoviesCsv(csv);
      expect(movies).toHaveLength(1);
      expect(movies[0]).toMatchObject({
        id: 2,
        title: 'Edge Movie',
        original_title: 'Original',
        original_language: 'fr',
        overview: 'Description',
        release_date: '2020-01-01',
        popularity: null,
        vote_average: null,
        vote_count: null,
        runtime_minutes: null,
        budget: null,
        revenue: null,
        genre_ids: [],
        country_codes: [],
      });
    });

    it('handles unparseable json in genres and production_countries', () => {
      const csv = makeCsv({
        id: '3',
        title: 'Movie JSON Error',
        genres: 'invalid-json',
        production_countries: 'invalid-json',
      });
      const movies = parseMoviesCsv(csv);
      expect(movies[0].genre_ids).toEqual([]);
      expect(movies[0].country_codes).toEqual([]);
    });

    it('handles non-array json in production_countries', () => {
      const csv = `${headerLine}
4,Movie JSON Obj,Original,en,Desc,2020-01-01,10,7,50,/poster.jpg,/backdrop.jpg,90,1000,2000,"[12]","{""not"":""array""}"`;
      const movies = parseMoviesCsv(csv);
      expect(movies[0].genre_ids).toEqual([12]);
      expect(movies[0].country_codes).toEqual([]);
    });

    it('throws when CSV is empty', () => {
      expect(() => parseMoviesCsv('  \n  ')).toThrow(
        /CSV file is empty: missing headers/,
      );
    });

    it('throws when headers are invalid or missing', () => {
      expect(() => parseMoviesCsv('id,title\n1,Test')).toThrow(
        /Invalid CSV headers for movies/,
      );
      expect(() =>
        parseMoviesCsv('id,title,unknown,extra\n1,Test,foo,bar'),
      ).toThrow(/Invalid CSV headers for movies/);
    });

    it('throws when CSV format is malformed', () => {
      expect(() => parseMoviesCsv(`${headerLine}\n1,"Unclosed quote`)).toThrow(
        /Invalid CSV format/,
      );
    });

    it('throws when id is invalid or not a positive integer', () => {
      expect(() =>
        parseMoviesCsv(makeCsv({ id: '0', title: 'Title' })),
      ).toThrow(/Invalid movie id "0"/);
      expect(() =>
        parseMoviesCsv(makeCsv({ id: '-1', title: 'Title' })),
      ).toThrow(/Invalid movie id "-1"/);
      expect(() =>
        parseMoviesCsv(makeCsv({ id: 'abc', title: 'Title' })),
      ).toThrow(/Invalid movie id "abc"/);
    });

    it('throws when title is empty', () => {
      expect(() => parseMoviesCsv(makeCsv({ id: '1', title: '   ' }))).toThrow(
        /Missing movie title/,
      );
    });
  });
});
