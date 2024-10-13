import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.tsx',
    './src/pages/**/*.ts',
    './src/pages/**/*.js',
    './src/pages/**/*.jsx',
    './src/components/**/*.tsx',
    './src/components/**/*.ts',
    './src/components/**/*.js',
    './src/components/**/*.jsx',
    './src/app/**/*.tsx',
    './src/app/**/*.ts',
    './src/app/**/*.js',
    './src/app/**/*.jsx',
    './src/utils/**/*.tsx',
    './src/utils/**/*.ts',
    './src/utils/**/*.js',
    './src/utils/**/*.jsx',
    './src/components/**/*.tsx',
    './src/app/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#EBF4F6',
          100: '#D7E9ED',
          200: '#AFD3DB',
          300: '#87BDC9',
          400: '#5FA7B7',
          500: '#37B7C3',
          600: '#088395',
          700: '#066270',
          800: '#04414B',
          900: '#071952',
        },
        red: {
          50: '#FFE5EB',
          100: '#FFCCD7',
          200: '#FF99AF',
          300: '#FF6687',
          400: '#FF335F',
          500: '#FF204E',
          600: '#CC1A3E',
          700: '#A0153E',
          800: '#730F2D',
          900: '#5D0E41',
        },
        bright: {
          50: '#FFF7E5',
          100: '#FFEFCC',
          200: '#FFDF99',
          300: '#FFCF66',
          400: '#FFBF33',
          500: '#FFB200',
          600: '#EB5B00',
          700: '#E4003A',
          800: '#B60071',
          900: '#8A0055',
        },
        blues: {
          dark: '#071952',
          mid: '#088395',
          bright: '#37B7C3',
          brightest: '#69effb',
          white: '#EBF4F6',
        },
        reds: {
          bright: '#FF204E',
          mid: '#A0153E',
          dark: '#5D0E41',
          blue: '#00224D',
        },
        sunsets: {
          yellow: '#FFB200',
          orange: '#EB5B00',
          red: '#E4003A',
          purple: '#B60071',
        }
      },
      fontFamily: {
        'gruppo': ['Gruppo', 'sans-serif'],
        'raleway': ['Raleway', 'sans-serif'],
        'header': ['Gruppo', 'sans-serif'],
        'para': ['Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config