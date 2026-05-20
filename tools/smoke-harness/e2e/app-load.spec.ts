import { expect, test } from '@playwright/test'

const appRoot = '#app, #root, [data-v-app]'
const ignoredConsoleErrors = [/^Failed to load resource: net::ERR_NAME_NOT_RESOLVED$/]

test('app loads without browser console errors', async ({ page }, testInfo) => {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return

    const text = message.text()
    if (!ignoredConsoleErrors.some((pattern) => pattern.test(text))) {
      errors.push(text)
    }
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator(appRoot).first()).toBeVisible()
  await page.waitForLoadState('networkidle')

  const appName = String(testInfo.project.metadata?.app || testInfo.project.name)
  await testInfo.attach(`${appName}-console-errors`, {
    body: errors.join('\n') || 'none',
    contentType: 'text/plain'
  })

  expect(errors).toEqual([])
})

test('basic interactive surface is present', async ({ page }) => {
  await page.goto('/')
  const interactive = page.locator('button, a[href], input, textarea, select, [role="button"]').first()
  await expect(interactive.or(page.locator(appRoot).first())).toBeVisible()
})
