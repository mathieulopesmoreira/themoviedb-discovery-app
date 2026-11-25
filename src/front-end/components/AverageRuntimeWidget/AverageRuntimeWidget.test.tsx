// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRuntimeWidget from './AverageRuntimeWidget';

afterEach(cleanup);

describe('AverageRuntimeWidget', () => {
  it('renders the rounded average runtime with min unit in nominal state', () => {
    render(<AverageRuntimeWidget averageRuntime={107} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Durée moyenne' }),
    ).toBeTruthy();
    expect(screen.getByText('107 min')).toBeTruthy();
    expect(
      screen.getByText('Sur les films avec durée renseignée'),
    ).toBeTruthy();
  });

  it('rounds decimal average runtimes', () => {
    render(<AverageRuntimeWidget averageRuntime={106.6} />);

    expect(screen.getByText('107 min')).toBeTruthy();
  });

  it('renders unavailable state when averageRuntime is null or omitted', () => {
    render(<AverageRuntimeWidget />);

    expect(screen.getByText('Donnée indisponible')).toBeTruthy();
    expect(screen.queryByText(/0\s*min/)).toBeNull();
  });

  it('renders loading state when isLoading is true', () => {
    render(<AverageRuntimeWidget isLoading />);

    const article = screen.getByRole('article', { name: 'Durée moyenne' });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders error message when error is provided', () => {
    render(
      <AverageRuntimeWidget error="Impossible de charger la durée moyenne." />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la durée moyenne.',
    );
  });
});
