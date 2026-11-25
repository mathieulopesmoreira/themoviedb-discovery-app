// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopCountryWidget from './TopCountryWidget';

afterEach(cleanup);

describe('TopCountryWidget', () => {
  it('renders the top country name and formatted movie count', () => {
    render(
      <TopCountryWidget
        countryName="United States of America"
        moviesCount={725}
      />,
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Pays le plus représenté',
      }),
    ).toBeTruthy();
    expect(screen.getByText('United States of America')).toBeTruthy();
    expect(screen.getByText('725 films')).toBeTruthy();
  });

  it('uses singular unit when moviesCount is 1', () => {
    render(<TopCountryWidget countryName="Japon" moviesCount={1} />);

    expect(screen.getByText('Japon')).toBeTruthy();
    expect(screen.getByText('1 film')).toBeTruthy();
  });

  it('renders unavailable state when countryName is missing', () => {
    render(<TopCountryWidget />);

    expect(screen.getByText('Aucun pays connu')).toBeTruthy();
  });

  it('renders unavailable state when moviesCount is null', () => {
    render(<TopCountryWidget countryName="France" moviesCount={null} />);

    expect(screen.getByText('Aucun pays connu')).toBeTruthy();
  });

  it('renders loading state when isLoading is true', () => {
    render(<TopCountryWidget isLoading />);

    const article = screen.getByRole('article', {
      name: 'Pays le plus représenté',
    });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders error message when error is provided', () => {
    render(
      <TopCountryWidget error="Impossible de charger le pays le plus représenté." />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le pays le plus représenté.',
    );
  });
});
