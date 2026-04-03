/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ECAE3C',  // الأزرق الداكن الرئيسي
          dark: '#ECAE3C',     // أزرق داكن أعمق
          light: '#60a5fa',    // أزرق فاتح
          50: '#f0f4f8',
          100: '#dbe7ee',
          200: '#b5d0dd',
          300: '#8cb8cc',
          400: '#5a9bb8',
          500: '#3b82f6',
          600: '#ECAE3C',
          700: '#ECAE3C',
          800: '#ECAE3C',
          900: '#ECAE3C',
          950: '#ECAE3C'
        },
        accent: {
          DEFAULT: '#ECAE3C',  // الذهبي/الأصفر المميز الجديد
          50: '#fefce8',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#ECAE3C',      // تدرج جديد
          500: '#ECAE3C',      // اللون الأساسي المميز الجديد
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        secondary: {
          DEFAULT: '#ECAE3C',  // الأزرق الثانوي
          light: '#60a5fa',
          dark: '#2563eb'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#ECAE3C',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        }
      },
      fontFamily: {
        'arabic': ['Cairo', 'Tajawal', 'Noto Sans Arabic', 'sans-serif']
      }
    },
  },
  plugins: [],
}