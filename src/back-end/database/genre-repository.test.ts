import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema.ts';
import {
  findGenreById,
  listGenres,
  upsertGenres,
  type Genre,
} from './genre-repository.ts';

describe('genre-repository.ts', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  describe('findGenreById', () => {
    it('returns undefined when the genre does not exist', () => {
      expect(findGenreById(database, 999)).toBeUndefined();
    });

    it('returns the genre when it exists', () => {
      upsertGenres(database, [{ id: 28, name: 'Action' }]);
      expect(findGenreById(database, 28)).toEqual({ id: 28, name: 'Action' });
    });
  });

  describe('listGenres', () => {
    it('returns an empty list when no genres exist', () => {
      expect(listGenres(database)).toEqual([]);
    });

    it('returns genres sorted by ascending id', () => {
      upsertGenres(database, [
        { id: 35, name: 'Comédie' },
        { id: 12, name: 'Aventure' },
        { id: 18, name: 'Drame' },
      ]);

      expect(listGenres(database)).toEqual([
        { id: 12, name: 'Aventure' },
        { id: 18, name: 'Drame' },
        { id: 35, name: 'Comédie' },
      ]);
    });
  });

  describe('upsertGenres', () => {
    it('does not modify existing data when given an empty iterable', () => {
      upsertGenres(database, [{ id: 18, name: 'Drame' }]);
      upsertGenres(database, []);

      expect(listGenres(database)).toEqual([{ id: 18, name: 'Drame' }]);
    });

    it('updates the name of an existing genre without creating duplicates', () => {
      upsertGenres(database, [{ id: 28, name: 'Action Old' }]);
      upsertGenres(database, [{ id: 28, name: 'Action' }]);

      expect(listGenres(database)).toEqual([{ id: 28, name: 'Action' }]);
    });

    it('keeps the last provided name when an id appears multiple times in the iterable', () => {
      upsertGenres(database, [
        { id: 16, name: 'Dessin animé' },
        { id: 16, name: 'Animation' },
      ]);

      expect(listGenres(database)).toEqual([{ id: 16, name: 'Animation' }]);
    });

    it('accepts non-array iterables such as a Set or generator', () => {
      const genreSet = new Set<Genre>([
        { id: 878, name: 'Science-Fiction' },
        { id: 14, name: 'Fantastique' },
      ]);

      upsertGenres(database, genreSet);

      expect(listGenres(database)).toEqual([
        { id: 14, name: 'Fantastique' },
        { id: 878, name: 'Science-Fiction' },
      ]);
    });

    it('enforces the mandatory name constraint and rolls back on error', () => {
      expect(() =>
        upsertGenres(database, [
          { id: 28, name: 'Action' },
          { id: 35, name: null as unknown as string },
        ]),
      ).toThrow(/NOT NULL constraint failed: genres\.name/);

      expect(listGenres(database)).toEqual([]);
    });
  });
});
