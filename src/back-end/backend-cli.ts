#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  cleanUnusedCountries,
  upsertCountries,
} from './database/country-repository.ts';
import {
  cleanUnusedGenres,
  upsertGenres,
} from './database/genre-repository.ts';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import { parseCountriesCsv, parseGenresCsv } from './utils/csv-parser.ts';

/** Command-line interface for movie database operations. */
const program = new Command()
  .description('CLI for movie database operations')
  .option('-p, --path <path>', 'path to the SQLite database file');

/**
 * Resolves the target database path from subcommand or root program options.
 * @param commandPath Optional path provided on the subcommand.
 * @returns The selected database file path.
 */
function resolveDatabasePath(commandPath?: string): string {
  const rootOptions = program.opts<{ path?: string }>();
  return commandPath ?? rootOptions.path ?? DEFAULT_DATABASE_PATH;
}

program
  .command('create-database')
  .description('Create and initialize the movies database schema')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action(({ path }: { path?: string }) => {
    const databasePath = resolveDatabasePath(path);
    const database = getDatabase(databasePath);
    database.close();
    console.log(`Database available at ${resolve(databasePath)}`);
  });

program
  .command('add-genres')
  .description('Import or update movie genres from a CSV file')
  .argument('<csv-file>', 'path to the genres CSV file')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action((csvFile: string, { path }: { path?: string }) => {
    const csvContent = readFileSync(resolve(csvFile), 'utf8');
    const genres = parseGenresCsv(csvContent);
    const databasePath = resolveDatabasePath(path);
    const database = getDatabase(databasePath);
    try {
      upsertGenres(database, genres);
    } finally {
      database.close();
    }
    console.log(
      `Imported ${genres.length} genres into ${resolve(databasePath)}`,
    );
  });

program
  .command('clean-genres')
  .description('Delete unused genres that are not associated with any movie')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action(({ path }: { path?: string }) => {
    const databasePath = resolveDatabasePath(path);
    const database = getDatabase(databasePath);
    let deletedCount = 0;
    try {
      deletedCount = cleanUnusedGenres(database);
    } finally {
      database.close();
    }
    console.log(
      `Removed ${deletedCount} unused genres from ${resolve(databasePath)}`,
    );
  });

program
  .command('add-countries')
  .description('Import or update production countries from a CSV file')
  .argument('<csv-file>', 'path to the countries CSV file')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action((csvFile: string, { path }: { path?: string }) => {
    const csvContent = readFileSync(resolve(csvFile), 'utf8');
    const countries = parseCountriesCsv(csvContent);
    const databasePath = resolveDatabasePath(path);
    const database = getDatabase(databasePath);
    try {
      upsertCountries(database, countries);
    } finally {
      database.close();
    }
    console.log(
      `Imported ${countries.length} countries into ${resolve(databasePath)}`,
    );
  });

program
  .command('clean-countries')
  .description('Delete unused countries that are not associated with any movie')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action(({ path }: { path?: string }) => {
    const databasePath = resolveDatabasePath(path);
    const database = getDatabase(databasePath);
    let deletedCount = 0;
    try {
      deletedCount = cleanUnusedCountries(database);
    } finally {
      database.close();
    }
    console.log(
      `Removed ${deletedCount} unused countries from ${resolve(databasePath)}`,
    );
  });

program.parse();
