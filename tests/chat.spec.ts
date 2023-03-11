import { expect, test } from '@playwright/test'

test('index page has the message box in focus', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByTestId('message-box')).toBeFocused()
})
