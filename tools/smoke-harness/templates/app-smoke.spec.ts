import { expect, test } from '@playwright/test'

// Copy this file when an app needs product-specific smoke checks.
test('custom app smoke', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#app')).toBeVisible()
})
