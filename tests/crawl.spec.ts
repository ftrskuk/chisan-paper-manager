import { test, expect } from '@playwright/test'

test('app should start and render login page', async ({ page }) => {
  // Go to root, should likely redirect or show login
  const response = await page.goto('/')

  // Check if status is OK (200-299)
  expect(response?.status()).toBeLessThan(400)

  // Check for common error texts
  const body = await page.textContent('body')
  expect(body).not.toContain(
    'Application error: a client-side exception has occurred'
  )
  expect(body).not.toContain('Internal Server Error')

  // If redirected to login, verify login form exists
  if (page.url().includes('/login')) {
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({
      timeout: 10000,
    })
  }
})

test('check for console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await page.goto('/login')
  expect(errors).toEqual([])
})
