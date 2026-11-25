import type { Meta, StoryObj } from '@storybook/react-vite';
import TopRatedMovieWidget from './TopRatedMovieWidget';

const DEMO_POSTER_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="270" viewBox="0 0 180 270"><rect width="180" height="270" fill="#1e293b"/><text x="50%" y="50%" fill="#e2e8f0" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">Affiche</text></svg>',
  );

const meta = {
  title: 'Widgets/TopRatedMovieWidget',
  component: TopRatedMovieWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    movie: {
      control: 'object',
      description: 'Film le mieux noté à afficher (ou null si aucun).',
    },
    isLoading: {
      control: 'boolean',
      description: 'Indique si la donnée est en cours de chargement.',
    },
    error: {
      control: 'text',
      description: "Message d'erreur éventuel lors du chargement.",
    },
  },
} satisfies Meta<typeof TopRatedMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    movie: {
      title: 'Les Évadés',
      releaseYear: 1994,
      rating: 9.1,
      posterUrl: DEMO_POSTER_URL,
    },
  },
};

export const MissingPoster: Story = {
  args: {
    movie: {
      title: 'Le Parrain',
      releaseYear: 1972,
      rating: 9.1,
      posterUrl: null,
    },
  },
};

export const BrokenPoster: Story = {
  args: {
    movie: {
      title: 'Film avec affiche inaccessible',
      releaseYear: 2020,
      rating: 8.8,
      posterUrl: 'https://invalid.example.com/missing-poster.jpg',
    },
  },
};

export const LongTitleAndUnknownYear: Story = {
  args: {
    movie: {
      title:
        "L'Incroyable Histoire d'un Film Indépendant au Titre Particulièrement Long et Détaillé",
      releaseYear: null,
      rating: 8.9,
      posterUrl: null,
    },
  },
};

export const Empty: Story = {
  args: {
    movie: null,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Impossible de charger le film le mieux noté.',
  },
};

export const DarkTheme: Story = {
  args: {
    movie: {
      title: 'Les Évadés',
      releaseYear: 1994,
      rating: 9.1,
      posterUrl: DEMO_POSTER_URL,
    },
  },
  globals: {
    theme: 'dark',
  },
};
