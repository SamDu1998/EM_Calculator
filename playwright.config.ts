import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './scripts',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  use: {
    screenshot: 'only-on-failure',
  },
  workers: 1,
})
