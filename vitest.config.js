/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    include: ['src/**/*.test.{js,jsx}', 'tests/unit/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/format.js', 'src/lib/share.js', 'src/lib/itinerary.js', 'src/lib/migrate.js'],
      reportsDirectory: './coverage',
      thresholds: { lines: 80, functions: 80, statements: 80 },
    },
  },
})
