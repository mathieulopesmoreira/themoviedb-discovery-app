import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRuntimeWidget from './AverageRuntimeWidget';

const meta = {
  title: 'Widgets/AverageRuntimeWidget',
  component: AverageRuntimeWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    averageRuntime: {
      control: 'number',
      description:
        'Durée moyenne en minutes calculée sur les films ayant une durée valide.',
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
} satisfies Meta<typeof AverageRuntimeWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    averageRuntime: 107,
  },
};

export const Unavailable: Story = {
  args: {
    averageRuntime: null,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Impossible de charger la durée moyenne.',
  },
};

export const DarkTheme: Story = {
  args: {
    averageRuntime: 107,
  },
  globals: {
    theme: 'dark',
  },
};
