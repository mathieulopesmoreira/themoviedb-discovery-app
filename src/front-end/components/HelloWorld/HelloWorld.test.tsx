// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HelloWorld from './HelloWorld';

afterEach(cleanup);

describe('HelloWorld', () => {
  it('renders the default greeting when no message is provided', () => {
    const expectedMessage = 'Hello World!';

    render(<HelloWorld />);

    expect(screen.getByText(expectedMessage)).toBeTruthy();
  });

  it('replaces the default greeting with the provided message', () => {
    const message = 'Welcome to Storybook!';

    render(<HelloWorld message={message} />);

    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.queryByText('Hello World!')).toBeNull();
  });
});
