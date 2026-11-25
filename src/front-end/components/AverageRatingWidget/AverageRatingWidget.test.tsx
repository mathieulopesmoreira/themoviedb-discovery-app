// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRatingWidget from './AverageRatingWidget';

afterEach(cleanup);

describe('AverageRatingWidget', () => {
  it('renders the formatted rating with French decimals and / 10 scale', () => {
    render(<AverageRatingWidget averageRating={6.78} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Note moyenne' }),
    ).toBeTruthy();
    expect(screen.getByText('6,78 / 10')).toBeTruthy();
    expect(screen.getByText('Moyenne simple des notes')).toBeTruthy();
  });

  it('always formats with two French decimal places', () => {
    render(<AverageRatingWidget averageRating={7} />);

    expect(screen.getByText('7,00 / 10')).toBeTruthy();
  });

  it('renders 0,00 / 10 as a valid rating distinct from missing data', () => {
    render(<AverageRatingWidget averageRating={0} />);

    expect(screen.getByText('0,00 / 10')).toBeTruthy();
    expect(screen.queryByText('Aucune note disponible')).toBeNull();
  });

  it('renders unavailable state when averageRating is null or omitted', () => {
    render(<AverageRatingWidget />);

    expect(screen.getByText('Aucune note disponible')).toBeTruthy();
    expect(screen.queryByText(/\/ 10/)).toBeNull();
  });

  it('renders loading state when isLoading is true', () => {
    render(<AverageRatingWidget isLoading />);

    const article = screen.getByRole('article', { name: 'Note moyenne' });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders error message when error is provided', () => {
    render(
      <AverageRatingWidget error="Impossible de charger la note moyenne." />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la note moyenne.',
    );
  });
});
