import type { Meta, StoryObj } from '@storybook/react-vite';
import MostProfitableMovieWidget from './MostProfitableMovieWidget';

const DEMO_POSTER_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="270" viewBox="0 0 180 270"><rect width="180" height="270" fill="#1e293b"/><text x="50%" y="50%" fill="#e2e8f0" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">Affiche</text></svg>',
  );

const meta = {
  title: 'Widgets/MostProfitableMovieWidget',
  component: MostProfitableMovieWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "Affiche le film le plus rentable fourni par l'appelant. La formule du ROI et les règles d'éligibilité des budgets/recettes doivent être validées avant branchement aux données réelles.",
      },
    },
  },
  argTypes: {
    movie: {
      control: 'object',
      description:
        'Film éligible le plus rentable avec ROI pré-calculé en % (ou null si aucun).',
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
} satisfies Meta<typeof MostProfitableMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    movie: {
      title: 'Paranormal Activity',
      releaseYear: 2007,
      roiPercentage: 69667.36,
      posterUrl: DEMO_POSTER_URL,
    },
  },
};

export const MissingPoster: Story = {
  args: {
    movie: {
      title: 'Paranormal Activity',
      releaseYear: 2007,
      roiPercentage: 69667.36,
      posterUrl: null,
    },
  },
};

export const UnknownValues: Story = {
  args: {
    movie: {
      title: 'Film aux données partielles',
      releaseYear: null,
      roiPercentage: null,
      posterUrl: null,
    },
  },
};

export const LongTitle: Story = {
  args: {
    movie: {
      title:
        "Le Projet Indépendant au Budget Minuscule et à la Rentabilité Record à Travers l'Histoire",
      releaseYear: 2007,
      roiPercentage: 69667.36,
      posterUrl: DEMO_POSTER_URL,
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
    error: 'Impossible de charger le film le plus rentable.',
  },
};

export const DarkTheme: Story = {
  args: {
    movie: {
      title: 'Paranormal Activity',
      releaseYear: 2007,
      roiPercentage: 69667.36,
      posterUrl: DEMO_POSTER_URL,
    },
  },
  globals: {
    theme: 'dark',
  },
};
