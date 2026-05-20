import { defineConfig, devices } from '@playwright/test'

const appProjects = [
  { name: 'timer', port: 3201, command: 'pnpm --dir ../../apps/timer dev:no-build -- --host 127.0.0.1 --port 3201 --strictPort' },
  { name: 'todo', port: 3202, command: 'pnpm --dir ../../apps/todo dev:no-build -- --host 127.0.0.1 --port 3202 --strictPort' }
]

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  webServer: appProjects.map((app) => ({
    command: app.command,
    url: `http://127.0.0.1:${app.port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  })),
  projects: appProjects.map((app) => ({
    name: app.name,
    use: {
      ...devices['Desktop Chrome'],
      baseURL: `http://127.0.0.1:${app.port}`,
      trace: 'retain-on-failure'
    },
    metadata: { app: app.name }
  }))
})
