// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopRatedMovieWidget from './TopRatedMovieWidget';

afterEach(cleanup);

describe('TopRatedMovieWidget', () => {
  it('renders the movie poster, title, year and formatted rating', () => {
    render(
      <TopRatedMovieWidget
        movie={{
          title: 'Les Évadés',
          releaseYear: 1994,
          rating: 9.1,
          posterUrl: 'https://example.com/poster.jpg',
        }}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Film le mieux noté' }),
    ).toBeTruthy();

    const poster = screen.getByRole('img', { name: 'Affiche de Les Évadés' });
    expect(poster.getAttribute('src')).toBe('https://example.com/poster.jpg');
    expect(screen.getByText('Les Évadés')).toBeTruthy();
    expect(screen.getByText('1994')).toBeTruthy();
    expect(screen.getByText('9,1 / 10')).toBeTruthy();
  });

  it('renders an explicit placeholder and fallback year when missing', () => {
    render(
      <TopRatedMovieWidget
        movie={{
          title: 'Film sans affiche',
          releaseYear: null,
          rating: 8.5,
          posterUrl: null,
        }}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Film sans affiche',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Affiche indisponible')).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(screen.getByText('8,5 / 10')).toBeTruthy();
  });

  it('replaces an inaccessible poster with the explicit placeholder on error', () => {
    render(
      <TopRatedMovieWidget
        movie={{
          title: 'Film affiche cassée',
          releaseYear: 2020,
          rating: 8.8,
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
    render(<TopRatedMovieWidget />);

    expect(screen.getByText('Aucun film noté')).toBeTruthy();
  });

  it('renders loading state when isLoading is true', () => {
    render(<TopRatedMovieWidget isLoading />);

    const article = screen.getByRole('article', {
      name: 'Film le mieux noté',
    });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders error message when error is provided', () => {
    render(
      <TopRatedMovieWidget error="Impossible de charger le film le mieux noté." />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le mieux noté.',
    );
  });
});
