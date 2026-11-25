import type { Meta, StoryObj } from '@storybook/react-vite';
import TopCountryWidget from './TopCountryWidget';

const meta = {
  title: 'Widgets/TopCountryWidget',
  component: TopCountryWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    countryName: {
      control: 'text',
      description: 'Nom du pays de production le plus représenté.',
    },
    moviesCount: {
      control: 'number',
      description: 'Nombre de films associés à ce pays (pré-calculé).',
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
} satisfies Meta<typeof TopCountryWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    countryName: 'United States of America',
    moviesCount: 725,
  },
};

export const LongCountryName: Story = {
  args: {
    countryName: "Royaume-Uni de Grande-Bretagne et d'Irlande du Nord",
    moviesCount: 142,
  },
};

export const SingleMovie: Story = {
  args: {
    countryName: 'Japon',
    moviesCount: 1,
  },
};

export const Unavailable: Story = {
  args: {
    countryName: null,
    moviesCount: null,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Impossible de charger le pays le plus représenté.',
  },
};

export const DarkTheme: Story = {
  args: {
    countryName: 'United States of America',
    moviesCount: 725,
  },
  globals: {
    theme: 'dark',
  },
};
