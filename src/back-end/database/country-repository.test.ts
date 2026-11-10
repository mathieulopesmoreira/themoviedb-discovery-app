import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema.ts';
import {
  cleanUnusedCountries,
  findCountryByCode,
  listCountries,
  upsertCountries,
  type Country,
} from './country-repository.ts';

describe('country-repository.ts', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  describe('findCountryByCode', () => {
    it('returns undefined when the country does not exist', () => {
      expect(findCountryByCode(database, 'ZZ')).toBeUndefined();
    });

    it('returns the country when it exists', () => {
      upsertCountries(database, [{ code: 'FR', name: 'France' }]);
      expect(findCountryByCode(database, 'FR')).toEqual({
        code: 'FR',
        name: 'France',
      });
    });
  });

  describe('listCountries', () => {
    it('returns an empty list when no countries exist', () => {
      expect(listCountries(database)).toEqual([]);
    });

    it('returns countries sorted by ascending code', () => {
      upsertCountries(database, [
        { code: 'US', name: 'United States' },
        { code: 'FR', name: 'France' },
        { code: 'DE', name: 'Germany' },
      ]);

      expect(listCountries(database)).toEqual([
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);
    });
  });

  describe('upsertCountries', () => {
    it('does not modify existing data when given an empty iterable', () => {
      upsertCountries(database, [{ code: 'FR', name: 'France' }]);
      upsertCountries(database, []);

      expect(listCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
    });

    it('updates the name of an existing country without creating duplicates', () => {
      upsertCountries(database, [{ code: 'FR', name: 'Ancien nom' }]);
      upsertCountries(database, [{ code: 'FR', name: 'France' }]);

      expect(listCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
    });

    it('keeps the last provided name when a code appears multiple times in the iterable', () => {
      upsertCountries(database, [
        { code: 'GB', name: 'Grande-Bretagne' },
        { code: 'GB', name: 'Royaume-Uni' },
      ]);

      expect(listCountries(database)).toEqual([
        { code: 'GB', name: 'Royaume-Uni' },
      ]);
    });

    it('accepts non-array iterables such as a Set or generator', () => {
      const countrySet = new Set<Country>([
        { code: 'IT', name: 'Italie' },
        { code: 'ES', name: 'Espagne' },
      ]);

      upsertCountries(database, countrySet);

      expect(listCountries(database)).toEqual([
        { code: 'ES', name: 'Espagne' },
        { code: 'IT', name: 'Italie' },
      ]);
    });

    it('enforces the mandatory name constraint and rolls back on error', () => {
      expect(() =>
        upsertCountries(database, [
          { code: 'FR', name: 'France' },
          { code: 'DE', name: null as unknown as string },
        ]),
      ).toThrow(/NOT NULL constraint failed: countries\.name/);

      expect(listCountries(database)).toEqual([]);
    });
  });

  describe('cleanUnusedCountries', () => {
    it('removes only countries not associated with any movie and keeps used ones', () => {
      upsertCountries(database, [
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);

      database
        .prepare(
          `INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
           VALUES (1, 'Movie 1', 'Movie 1', 'fr', 'Synopsis', '2026-01-01T00:00:00Z')`,
        )
        .run();
      database
        .prepare(
          "INSERT INTO production_countries (movie_id, country_code) VALUES (1, 'FR')",
        )
        .run();

      const removed = cleanUnusedCountries(database);

      expect(removed).toBe(2);
      expect(listCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
    });
  });
});
