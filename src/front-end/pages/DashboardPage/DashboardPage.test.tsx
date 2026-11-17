// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardPage from './DashboardPage';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('renders the dashboard page heading, description and empty state', () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();

    expect(screen.getByText(/Visualisez les indicateurs clés/i)).toBeTruthy();

    expect(
      screen.getByText("Aucun widget n'est encore configuré."),
    ).toBeTruthy();
  });
});
