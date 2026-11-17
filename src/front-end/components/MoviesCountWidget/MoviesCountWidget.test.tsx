// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MoviesCountWidget from './MoviesCountWidget';

afterEach(cleanup);

describe('MoviesCountWidget', () => {
  it('renders the formatted movie count in nominal state', () => {
    render(<MoviesCountWidget count={1245} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Films en base' }),
    ).toBeTruthy();
    expect(screen.getByText(/^1\s245$/)).toBeTruthy();
    expect(screen.getByText('films enregistrés')).toBeTruthy();
  });

  it('uses singular caption when count is 1', () => {
    render(<MoviesCountWidget count={1} />);

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('film enregistré')).toBeTruthy();
  });

  it('renders empty state caption when count is 0', () => {
    render(<MoviesCountWidget count={0} />);

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('Aucun film en base')).toBeTruthy();
  });

  it('renders unavailable state when count is null or omitted', () => {
    render(<MoviesCountWidget />);

    expect(screen.getByText('Donnée indisponible')).toBeTruthy();
  });

  it('renders loading state when isLoading is true', () => {
    render(<MoviesCountWidget isLoading />);

    const article = screen.getByRole('article', { name: 'Films en base' });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders error message when error is provided', () => {
    render(
      <MoviesCountWidget error="Impossible de charger le nombre de films." />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le nombre de films.',
    );
  });
});
