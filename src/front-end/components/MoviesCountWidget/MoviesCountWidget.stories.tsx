import type { Meta, StoryObj } from '@storybook/react-vite';
import MoviesCountWidget from './MoviesCountWidget';

const meta = {
  title: 'Widgets/MoviesCountWidget',
  component: MoviesCountWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    count: {
      control: 'number',
      description: 'Nombre de films présents en base de données.',
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
} satisfies Meta<typeof MoviesCountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 1245,
  },
};

export const SingleMovie: Story = {
  args: {
    count: 1,
  },
};

export const Empty: Story = {
  args: {
    count: 0,
  },
};

export const Unavailable: Story = {
  args: {
    count: null,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Impossible de charger le nombre de films.',
  },
};

export const DarkTheme: Story = {
  args: {
    count: 1245,
  },
  globals: {
    theme: 'dark',
  },
};
