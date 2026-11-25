// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostPopularMovieWidget from './MostPopularMovieWidget';

afterEach(cleanup);

describe('MostPopularMovieWidget', () => {
  it('renders poster, title, year and formatted popularity index', () => {
    render(
      <MostPopularMovieWidget
        movie={{
          title: 'Dune : Deuxième Partie',
          releaseYear: 2024,
          popularity: 1036.49,
          posterUrl: 'https://example.com/dune.jpg',
        }}
      />,
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Film le plus populaire',
      }),
    ).toBeTruthy();

    const poster = screen.getByRole('img', {
      name: 'Affiche de Dune : Deuxième Partie',
    });
    expect(poster.getAttribute('src')).toBe('https://example.com/dune.jpg');
    expect(screen.getByText('Dune : Deuxième Partie')).toBeTruthy();
    expect(screen.getByText('2024')).toBeTruthy();
    expect(screen.getByText(/^1\s036,49 popularité$/)).toBeTruthy();
    expect(screen.queryByText(/\/ 10/)).toBeNull();
  });

  it('renders fallback placeholder, year and unknown popularity when missing', () => {
    render(
      <MostPopularMovieWidget
        movie={{
          title: 'Film incomplet',
          releaseYear: null,
          popularity: null,
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
    expect(screen.getByText('Popularité inconnue')).toBeTruthy();
  });

  it('replaces an inaccessible poster with the explicit placeholder on error', () => {
    render(
      <MostPopularMovieWidget
        movie={{
          title: 'Film affiche cassée',
          releaseYear: 2024,
          popularity: 512.5,
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
    render(<MostPopularMovieWidget />);

    expect(screen.getByText('Aucun film disponible')).toBeTruthy();
  });

  it('renders loading state when isLoading is true', () => {
    render(<MostPopularMovieWidget isLoading />);

    const article = screen.getByRole('article', {
      name: 'Film le plus populaire',
    });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders error message when error is provided', () => {
    render(
      <MostPopularMovieWidget error="Impossible de charger le film le plus populaire." />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le plus populaire.',
    );
  });
});
