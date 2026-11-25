import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRatingWidget from './AverageRatingWidget';

const meta = {
  title: 'Widgets/AverageRatingWidget',
  component: AverageRatingWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    averageRating: {
      control: 'number',
      description:
        'Moyenne simple sur 10 des notes du catalogue (distincte de la note pondérée).',
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
} satisfies Meta<typeof AverageRatingWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    averageRating: 6.78,
  },
};

export const ZeroRating: Story = {
  args: {
    averageRating: 0,
  },
};

export const Unavailable: Story = {
  args: {
    averageRating: null,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Impossible de charger la note moyenne.',
  },
};

export const DarkTheme: Story = {
  args: {
    averageRating: 6.78,
  },
  globals: {
    theme: 'dark',
  },
};
