import { describe, expect, it } from 'vitest';
import { parseCountriesCsv, parseGenresCsv } from './csv-parser.ts';

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

  describe('parseCountriesCsv', () => {
    it('parses standard CSV with code,name headers', () => {
      const csv = 'code,name\nFR,France\nUS,United States\n';
      expect(parseCountriesCsv(csv)).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);
    });

    it('accepts headers in any order and case-insensitively with spaces around values', () => {
      const csv = '  NAME , CODE \n France , FR \n Germany , DE ';
      expect(parseCountriesCsv(csv)).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'DE', name: 'Germany' },
      ]);
    });

    it('supports UTF-8 BOM, CRLF line endings, empty lines, commas in quotes and escaped quotes', () => {
      const csv =
        '\uFEFFcode,name\r\n\r\nFR,"France, Métropolitaine"\r\nGB,"Royaume ""Uni"""\r\n\r\n';
      expect(parseCountriesCsv(csv)).toEqual([
        { code: 'FR', name: 'France, Métropolitaine' },
        { code: 'GB', name: 'Royaume "Uni"' },
      ]);
    });

    it('returns an empty array when only valid headers are present', () => {
      expect(parseCountriesCsv('code,name\n\n')).toEqual([]);
    });

    it('throws an explicit error when the CSV file is completely empty', () => {
      expect(() => parseCountriesCsv('   \n  ')).toThrow(
        /CSV file is empty: missing headers/,
      );
    });

    it('throws an explicit error when headers are invalid or duplicated', () => {
      expect(() => parseCountriesCsv('code,title\nFR,France')).toThrow(
        /Invalid CSV headers/,
      );
      expect(() => parseCountriesCsv('code\nFR')).toThrow(
        /Invalid CSV headers/,
      );
      expect(() => parseCountriesCsv('code,code\nFR,FR')).toThrow(
        /Invalid CSV headers/,
      );
    });

    it('throws an explicit error on malformed CSV quotes', () => {
      expect(() => parseCountriesCsv('code,name\nFR,"Unclosed quote')).toThrow(
        /Invalid CSV format/,
      );
    });

    it('throws an explicit error when code is not two uppercase letters', () => {
      expect(() => parseCountriesCsv('code,name\nfr,France')).toThrow(
        /Invalid country code/,
      );
      expect(() => parseCountriesCsv('code,name\nFRA,France')).toThrow(
        /Invalid country code/,
      );
      expect(() => parseCountriesCsv('code,name\nF1,France')).toThrow(
        /Invalid country code/,
      );
      expect(() => parseCountriesCsv('code,name\n,France')).toThrow(
        /Invalid country code/,
      );
    });

    it('throws an explicit error when name is empty', () => {
      expect(() => parseCountriesCsv('code,name\nFR,   ')).toThrow(
        /Empty country name/,
      );
    });
  });
});
