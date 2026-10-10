export type ContentColorPreset =
  | 'neutral'
  | 'slate'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'amber'
  | 'orange'
  | 'red'
  | 'pink'
  | 'purple';

export type ContentColorOption = {
  value: ContentColorPreset;
  label: string;
  lightHex: string;
  darkHex: string;
  className: string;
};

export const CONTENT_COLOR_PALETTE: ContentColorOption[] = [
  {
    value: 'neutral',
    label: 'Neutro',
    lightHex: '#111827',
    darkHex: '#f9fafb',
    className: 'text-gray-900 dark:text-gray-50',
  },
  {
    value: 'slate',
    label: 'Pizarra',
    lightHex: '#334155',
    darkHex: '#cbd5e1',
    className: 'text-slate-700 dark:text-slate-300',
  },
  {
    value: 'blue',
    label: 'Azul',
    lightHex: '#1d4ed8',
    darkHex: '#93c5fd',
    className: 'text-blue-700 dark:text-blue-300',
  },
  {
    value: 'cyan',
    label: 'Cian',
    lightHex: '#0e7490',
    darkHex: '#67e8f9',
    className: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    value: 'green',
    label: 'Verde',
    lightHex: '#15803d',
    darkHex: '#86efac',
    className: 'text-green-700 dark:text-green-300',
  },
  {
    value: 'amber',
    label: 'Ambar',
    lightHex: '#b45309',
    darkHex: '#fcd34d',
    className: 'text-amber-700 dark:text-amber-300',
  },
  {
    value: 'orange',
    label: 'Naranja',
    lightHex: '#c2410c',
    darkHex: '#fdba74',
    className: 'text-orange-700 dark:text-orange-300',
  },
  {
    value: 'red',
    label: 'Rojo',
    lightHex: '#b91c1c',
    darkHex: '#fca5a5',
    className: 'text-red-700 dark:text-red-300',
  },
  {
    value: 'pink',
    label: 'Rosa',
    lightHex: '#be185d',
    darkHex: '#f9a8d4',
    className: 'text-pink-700 dark:text-pink-300',
  },
  {
    value: 'purple',
    label: 'Violeta',
    lightHex: '#7e22ce',
    darkHex: '#d8b4fe',
    className: 'text-purple-700 dark:text-purple-300',
  },
];

export const getContentColorOption = (value?: string): ContentColorOption => {
  return (
    CONTENT_COLOR_PALETTE.find(option => option.value === value) ||
    CONTENT_COLOR_PALETTE[0]
  );
};
