import { skeleton } from '@skeletonlabs/tw-plugin';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    require('path').join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    skeleton({
      themes: {
        custom: [
          {
            name: 'sakha-theme',
            properties: {
              // Primary (icy cyan-blue)
              '--color-primary-50': '204 235 255',
              '--color-primary-100': '174 220 255',
              '--color-primary-200': '143 205 255',
              '--color-primary-300': '102 181 255',
              '--color-primary-400': '62 156 255',
              '--color-primary-500': '30 130 230',
              '--color-primary-600': '20 100 190',
              '--color-primary-700': '14 75 150',
              '--color-primary-800': '10 55 115',
              '--color-primary-900': '6 35 80',
              // Surface (deep dark blue-slate)
              '--color-surface-50': '230 233 240',
              '--color-surface-100': '200 207 220',
              '--color-surface-200': '155 165 185',
              '--color-surface-300': '110 122 148',
              '--color-surface-400': '70 82 110',
              '--color-surface-500': '40 48 72',
              '--color-surface-600': '28 34 56',
              '--color-surface-700': '18 22 40',
              '--color-surface-800': '12 15 28',
              '--color-surface-900': '8 10 20',
              // Tertiary (warm amber)
              '--color-tertiary-50': '255 245 220',
              '--color-tertiary-100': '255 235 190',
              '--color-tertiary-200': '255 220 150',
              '--color-tertiary-300': '255 200 100',
              '--color-tertiary-400': '255 180 50',
              '--color-tertiary-500': '230 160 20',
              '--color-tertiary-600': '190 130 10',
              '--color-tertiary-700': '150 100 5',
              '--color-tertiary-800': '115 75 2',
              '--color-tertiary-900': '80 50 0',
              // Success
              '--color-success-50': '220 255 235',
              '--color-success-100': '180 255 210',
              '--color-success-200': '130 240 175',
              '--color-success-300': '80 220 140',
              '--color-success-400': '40 200 110',
              '--color-success-500': '16 185 90',
              '--color-success-600': '10 150 72',
              '--color-success-700': '5 120 55',
              '--color-success-800': '2 90 40',
              '--color-success-900': '0 65 28',
              // Warning
              '--color-warning-50': '255 250 220',
              '--color-warning-100': '255 240 180',
              '--color-warning-200': '255 225 130',
              '--color-warning-300': '255 210 80',
              '--color-warning-400': '250 190 40',
              '--color-warning-500': '234 179 8',
              '--color-warning-600': '190 145 5',
              '--color-warning-700': '150 110 2',
              '--color-warning-800': '115 85 0',
              '--color-warning-900': '80 58 0',
              // Error
              '--color-error-50': '255 225 225',
              '--color-error-100': '255 200 200',
              '--color-error-200': '255 165 165',
              '--color-error-300': '255 125 125',
              '--color-error-400': '248 90 90',
              '--color-error-500': '239 68 68',
              '--color-error-600': '200 50 50',
              '--color-error-700': '160 35 35',
              '--color-error-800': '120 25 25',
              '--color-error-900': '85 15 15',
              // Border radius
              '--theme-rounded-base': '16px',
              '--theme-rounded-container': '24px',
              // Border
              '--theme-border-base': '1px',
              // Fonts
              '--theme-font-family-base': "'Space Grotesk', system-ui, sans-serif",
              '--theme-font-family-heading': "'Outfit', system-ui, sans-serif",
              '--theme-font-color-base': '200 207 220',
              '--theme-font-color-dark': '230 233 240',
              // Ring
              '--on-primary': '255 255 255',
              '--on-surface': '230 233 240',
              '--on-tertiary': '0 0 0',
              '--on-success': '255 255 255',
              '--on-warning': '0 0 0',
              '--on-error': '255 255 255',
            }
          }
        ]
      }
    })
  ],
};
