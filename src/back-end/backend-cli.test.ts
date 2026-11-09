import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listGenres } from './database/genre-repository.ts';

const { DEFAULT_DATABASE_PATH, closeMock, getDatabaseMock, realHolder } =
  vi.hoisted(() => ({
    DEFAULT_DATABASE_PATH: '/tmp/movies-default.sqlite',
    closeMock: vi.fn(),
    getDatabaseMock: vi.fn(),
    realHolder: {
      getDatabase: null as unknown as (
        path?: string,
        force?: boolean,
      ) => DatabaseSync,
    },
  }));

vi.mock('./database/schema.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./database/schema.ts')>();
  realHolder.getDatabase = actual.getDatabase;
  return {
    ...actual,
    DEFAULT_DATABASE_PATH,
    getDatabase: (path: string) => getDatabaseMock(path),
  };
});

/**
 * Executes the backend CLI with the specified command-line arguments
 * @param args The command-line arguments to pass to the CLI
 */
async function runCliWithArgs(args: string[]): Promise<void> {
  const originalArgv = process.argv;
  process.argv = ['node', 'src/back-end/backend-cli.ts', ...args];
  try {
    await import('./backend-cli.ts');
  } finally {
    process.argv = originalArgv;
  }
}

describe('backend-cli.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    getDatabaseMock.mockImplementation(
      () =>
        ({
          close: closeMock,
        }) as unknown as DatabaseSync,
    );
  });

  describe('create-database', () => {
    it('uses the default database path when the subcommand has no path option', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database']);

        expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Database available at ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('uses the path passed in --path', async () => {
      const customDatabasePath = './data/custom-movies.sqlite';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database', '--path', customDatabasePath]);

        expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Database available at ${resolve(customDatabasePath)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });
  });

  describe('add-genres', () => {
    it('imports genres into the selected database, closes connection and logs result', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'cli-genres-'));
      const dbPath = join(dir, 'movies.sqlite');
      const csvPath = join(dir, 'genres.csv');
      writeFileSync(csvPath, 'id,name\n28,Action\n12,Aventure\n', 'utf8');

      let closed = false;
      getDatabaseMock.mockImplementation((path: string) => {
        const db = realHolder.getDatabase(path);
        const origClose = db.close.bind(db);
        db.close = () => {
          closed = true;
          origClose();
        };
        return db;
      });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['--path', dbPath, 'add-genres', csvPath]);

        expect(closed).toBe(true);
        expect(logSpy).toHaveBeenCalledWith(
          `Imported 2 genres into ${resolve(dbPath)}`,
        );

        const verifyDb = realHolder.getDatabase(dbPath);
        expect(listGenres(verifyDb)).toEqual([
          { id: 12, name: 'Aventure' },
          { id: 28, name: 'Action' },
        ]);
        verifyDb.close();
      } finally {
        logSpy.mockRestore();
      }
    });

    it('validates the CSV before opening the database', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'cli-genres-invalid-'));
      const csvPath = join(dir, 'invalid.csv');
      writeFileSync(csvPath, 'invalid,headers\n1,Test\n', 'utf8');

      await expect(runCliWithArgs(['add-genres', csvPath])).rejects.toThrow(
        /Invalid CSV headers/,
      );
      expect(getDatabaseMock).not.toHaveBeenCalled();
    });
  });

  describe('clean-genres', () => {
    it('deletes only unused genres, closes the database and logs the result', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'cli-clean-genres-'));
      const dbPath = join(dir, 'movies.sqlite');

      let closed = false;
      getDatabaseMock.mockImplementation((path: string) => {
        const db = realHolder.getDatabase(path);
        const origClose = db.close.bind(db);
        db.close = () => {
          closed = true;
          origClose();
        };
        return db;
      });

      // Trigger schema module import so realHolder.getDatabase is populated
      await import('./database/schema.ts');

      const setupDb = realHolder.getDatabase(dbPath);
      setupDb
        .prepare('INSERT INTO genres (id, name) VALUES (18, ?), (28, ?)')
        .run('Drame', 'Action');
      setupDb
        .prepare(
          `INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
           VALUES (1, 'Film', 'Film', 'fr', 'Desc', '2026-01-01T00:00:00Z')`,
        )
        .run();
      setupDb
        .prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 18)')
        .run();
      setupDb.close();

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['--path', dbPath, 'clean-genres']);

        expect(closed).toBe(true);
        expect(logSpy).toHaveBeenCalledWith(
          `Removed 1 unused genres from ${resolve(dbPath)}`,
        );

        const verifyDb = realHolder.getDatabase(dbPath);
        expect(listGenres(verifyDb)).toEqual([{ id: 18, name: 'Drame' }]);
        verifyDb.close();
      } finally {
        logSpy.mockRestore();
      }
    });
  });
});
