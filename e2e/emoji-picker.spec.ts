import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import ChatWindow from '@/lib/ChatWindow.vue'
import { currentUserId, messages, rooms } from './fixtures'

/**
 * Render ChatWindow with messages visible (see screenshots.spec.ts).
 */
function renderWithMessages(props: Record<string, unknown>) {
	const result = render(ChatWindow, {
		props: {
			...props,
			messagesLoaded: false,
		},
	})
	result.rerender({ messagesLoaded: true } as any)
	return result
}

/**
 * Find and click the footer emoji button, then wait for the picker to appear.
 * Uses native .click() to avoid Playwright strict-mode issues with
 * duplicate `.vac-svg-button` selectors (footer vs reaction buttons).
 */
async function openFooterEmojiPicker() {
	const emojiWrapper = document.querySelector(
		'.vac-icon-textarea .vac-emoji-wrapper',
	) as HTMLElement
	expect(emojiWrapper).toBeTruthy()

	const button = emojiWrapper.querySelector('.vac-svg-button') as HTMLElement
	button.click()

	// Wait for Vue to process the reactivity and render the picker
	await expect.poll(() => document.querySelector('.vac-emoji-picker')).toBeTruthy()

	return {
		picker: document.querySelector('.vac-emoji-picker') as HTMLElement,
		emojiWrapper,
	}
}

describe('emoji picker positioning', () => {
	it('desktop — picker appears above the emoji button with fixed positioning', async () => {
		await page.viewport(1280, 720)

		const { unmount } = renderWithMessages({
			currentUserId,
			rooms,
			messages,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			responsiveBreakpoint: 0,
			height: '500px',
		})

		await expect.element(page.getByText('Hey Leia, how are you?')).toBeVisible()

		const { picker, emojiWrapper } = await openFooterEmojiPicker()

		// Should use fixed positioning to escape overflow containers
		expect(picker.style.position).toBe('fixed')

		// Picker should be above the emoji button
		const buttonRect = emojiWrapper.getBoundingClientRect()
		const pickerRect = picker.getBoundingClientRect()
		expect(pickerRect.bottom).toBeLessThanOrEqual(buttonRect.top + 15)

		// Picker's right edge should align with the button's right edge
		expect(Math.abs(pickerRect.right - buttonRect.right)).toBeLessThan(5)

		// Visual regression
		const chatWindow = document.querySelector('.vac-card-window') as HTMLElement
		await expect.element(page.elementLocator(chatWindow)).toMatchScreenshot('emoji-picker-desktop', {
			comparatorOptions: { allowedMismatchedPixelRatio: 0.03 },
		})

		// Let emoji-picker custom element finish its setTimeout before unmounting
		await new Promise(r => setTimeout(r, 50))
		unmount()
	})

	it('mobile — picker appears centered and fills most of the viewport', async () => {
		await page.viewport(400, 600)

		const { unmount } = renderWithMessages({
			currentUserId,
			rooms,
			messages,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			responsiveBreakpoint: 0,
			height: '500px',
		})

		await expect.element(page.getByText('Hey Leia, how are you?')).toBeVisible()

		const { picker } = await openFooterEmojiPicker()

		// Height should be approximately innerHeight - 200
		const expectedHeight = window.innerHeight - 200
		const actualHeight = picker.getBoundingClientRect().height
		expect(Math.abs(actualHeight - expectedHeight)).toBeLessThan(20)

		// Picker should be roughly centered horizontally
		const pickerRect = picker.getBoundingClientRect()
		const viewportCenter = window.innerWidth / 2
		const pickerCenter = pickerRect.left + pickerRect.width / 2
		expect(Math.abs(pickerCenter - viewportCenter)).toBeLessThan(100)

		// Let emoji-picker custom element finish its setTimeout before unmounting
		await new Promise(r => setTimeout(r, 50))
		unmount()
	})
})
