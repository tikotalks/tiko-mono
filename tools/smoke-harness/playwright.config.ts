import { defineConfig, devices } from '@playwright/test'

const smokeEnv = 'VITE_SUPABASE_URL=https://kejvhvszhevfwgsztedf.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=smoke-harness'

const appProjects = [
  { name: 'cards', port: 3201, command: `${smokeEnv} corepack pnpm --dir ../../apps/cards dev:no-build --host 127.0.0.1 --port 3201 --strictPort` },
  { name: 'sequence', port: 3202, command: `${smokeEnv} corepack pnpm --dir ../../apps/sequence dev:no-build --host 127.0.0.1 --port 3202 --strictPort` },
  { name: 'type', port: 3203, command: `${smokeEnv} corepack pnpm --dir ../../apps/type dev:no-build --host 127.0.0.1 --port 3203 --strictPort` },
  { name: 'yes-no', port: 3204, command: `${smokeEnv} corepack pnpm --dir ../../apps/yes-no dev:no-build --host 127.0.0.1 --port 3204 --strictPort` },
  { name: 'radio', port: 3205, command: `${smokeEnv} corepack pnpm --dir ../../apps/radio dev:no-build --host 127.0.0.1 --port 3205 --strictPort` },
  { name: 'tiko', port: 3206, command: `${smokeEnv} corepack pnpm --dir ../../apps/tiko dev:no-build --host 127.0.0.1 --port 3206 --strictPort` },
  { name: 'timer', port: 3207, command: `${smokeEnv} corepack pnpm --dir ../../apps/timer dev:no-build --host 127.0.0.1 --port 3207 --strictPort` },
  { name: 'todo', port: 3208, command: `${smokeEnv} corepack pnpm --dir ../../apps/todo dev:no-build --host 127.0.0.1 --port 3208 --strictPort` }
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
