// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostProfitableMovieWidget from './MostProfitableMovieWidget';

afterEach(cleanup);

describe('MostProfitableMovieWidget', () => {
  it('renders poster, title, year and formatted ROI percentage', () => {
    render(
      <MostProfitableMovieWidget
        movie={{
          title: 'Paranormal Activity',
          releaseYear: 2007,
          roiPercentage: 69667.36,
          posterUrl: 'https://example.com/paranormal.jpg',
        }}
      />,
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Film le plus rentable',
      }),
    ).toBeTruthy();

    const poster = screen.getByRole('img', {
      name: 'Affiche de Paranormal Activity',
    });
    expect(poster.getAttribute('src')).toBe(
      'https://example.com/paranormal.jpg',
    );
    expect(screen.getByText('Paranormal Activity')).toBeTruthy();
    expect(screen.getByText('2007')).toBeTruthy();
    expect(screen.getByText(/^69\s667,36 % ROI$/)).toBeTruthy();
  });

  it('renders fallback placeholder, year and unknown ROI when missing', () => {
    render(
      <MostProfitableMovieWidget
        movie={{
          title: 'Film incomplet',
          releaseYear: null,
          roiPercentage: null,
          posterUrl: null,
        }}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Film incomplet',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Affiche indisponible')).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(screen.getByText('ROI inconnu')).toBeTruthy();
    expect(screen.queryByText(/0,00 % ROI/)).toBeNull();
  });

  it('replaces an inaccessible poster with the explicit placeholder on error', () => {
    render(
      <MostProfitableMovieWidget
        movie={{
          title: 'Film affiche cassée',
          releaseYear: 2007,
          roiPercentage: 120,
          posterUrl: 'https://invalid.example.com/poster.jpg',
        }}
      />,
    );

    const poster = screen.getByRole('img', {
      name: 'Affiche de Film affiche cassée',
    });
    fireEvent.error(poster);

    expect(screen.getByText('Affiche indisponible')).toBeTruthy();
  });

  it('renders empty state when movie is null or omitted', () => {
    render(<MostProfitableMovieWidget />);

    expect(screen.getByText('Aucun film éligible')).toBeTruthy();
  });

  it('renders loading state when isLoading is true', () => {
    render(<MostProfitableMovieWidget isLoading />);

    const article = screen.getByRole('article', {
      name: 'Film le plus rentable',
    });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders error message when error is provided', () => {
    render(
      <MostProfitableMovieWidget error="Impossible de charger le film le plus rentable." />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le plus rentable.',
    );
  });
});
