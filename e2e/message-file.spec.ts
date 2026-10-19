import type { Message } from '@/types'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import ChatWindow from '@/lib/ChatWindow.vue'
import { currentUserId, messages, rooms } from './fixtures'

function renderWithMessage(message: Message) {
	const result = render(ChatWindow, {
		props: {
			currentUserId,
			rooms,
			messages: [...messages, message],
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
			messagesLoaded: false,
		},
	})
	result.rerender({ messagesLoaded: true } as any)
	return result
}

const ownImageMessage = (file: Message['files'][number]): Message => ({
	_id: 'msg-own-image',
	senderId: currentUserId,
	content: 'My photo',
	username: 'Luke',
	date: '28 Feb 2026',
	timestamp: '10:50',
	saved: true,
	files: [file],
})

const image = () => document.querySelector<HTMLElement>('#msg-own-image .vac-message-image')

describe('message file', () => {
	// e.g. a copy the app keeps on the device to show it offline
	it('shows a finished image from a blob: url once it loaded, without the loader', async () => {
		const blob = await (await fetch('/sample.png')).blob()
		const url = URL.createObjectURL(blob)

		renderWithMessage(
			ownImageMessage({ name: 'photo.png', type: 'image/png', extension: 'png', url }),
		)

		await expect.poll(() => image()).toBeTruthy()
		await expect.poll(() => image()?.classList.contains('vac-blur-loading')).toBe(false)
		URL.revokeObjectURL(url)
	})

	it('shows an upload\'s progress instead', async () => {
		renderWithMessage(
			ownImageMessage({
				name: 'photo.png',
				type: 'image/png',
				extension: 'png',
				url: '/sample.png',
				progress: 40,
			}),
		)

		await expect.poll(() => document.querySelector('#msg-own-image .vac-progress-wrapper')).toBeTruthy()
	})
})
