import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import ChatWindow from '@/lib/ChatWindow.vue'
import {
	audioMessage,
	currentUserId,
	fileMessage,
	imageMessage,
	messages,
	rooms,
	uploadingImageMessage,
} from './fixtures'

function locateBySelector(selector: string) {
	const el = document.querySelector(selector) as HTMLElement
	if (!el) throw new Error(`Element not found: ${selector}`)
	return page.elementLocator(el)
}

/**
 * Render ChatWindow with messages and wait for them to become visible.
 *
 * The Room component sets `loadingMessages = true` on room change and clears
 * it via a non-immediate watcher on `messagesLoaded`. We render with
 * `messagesLoaded: false` first, then rerender with `true` to trigger it.
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

describe('visual screenshot tests', () => {
	it('chat window — light theme', async () => {
		renderWithMessages({
			currentUserId,
			rooms,
			messages,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText('Hey Leia, how are you?')).toBeVisible()
		const chatWindow = locateBySelector('.vac-card-window')
		await expect.element(chatWindow).toMatchScreenshot('chat-window-light')
	})

	it('chat window — dark theme', async () => {
		renderWithMessages({
			currentUserId,
			rooms,
			messages,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			theme: 'dark',
			height: '500px',
		})

		await expect.element(page.getByText('Hey Leia, how are you?')).toBeVisible()
		const chatWindow = locateBySelector('.vac-card-window')
		await expect.element(chatWindow).toMatchScreenshot('chat-window-dark')
	})

	it('no room selected', async () => {
		render(ChatWindow, {
			props: {
				currentUserId,
				rooms,
				messages: [],
				roomsLoaded: true,
				loadFirstRoom: false,
				responsiveBreakpoint: 0,
				height: '500px',
			},
		})

		await expect.element(page.getByText('No room selected')).toBeVisible()
		const chatWindow = locateBySelector('.vac-card-window')
		await expect.element(chatWindow).toMatchScreenshot('no-room-selected')
	})

	it('messages with reactions', async () => {
		renderWithMessages({
			currentUserId,
			rooms,
			messages,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText('Nice! We should meet up soon.')).toBeVisible()
		// msg-3 has a 👍 reaction
		const reactionMessage = locateBySelector('#msg-3')
		await expect.element(reactionMessage).toMatchScreenshot('message-with-reaction')
	})

	it('message with reply', async () => {
		renderWithMessages({
			currentUserId,
			rooms,
			messages,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText("Sounds like a plan! I'll bring Han.")).toBeVisible()
		// msg-5 has a replyMessage
		const replyMessage = locateBySelector('#msg-5')
		await expect.element(replyMessage).toMatchScreenshot('message-with-reply')
	})

	it('audio player', async () => {
		const messagesWithAudio = [...messages, audioMessage]

		renderWithMessages({
			currentUserId,
			rooms,
			messages: messagesWithAudio,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText('Hey Leia, how are you?')).toBeVisible()
		const audioPlayer = locateBySelector('.vac-audio-player')
		await expect.element(audioPlayer).toMatchScreenshot('audio-player')
	})

	it('message with image', async () => {
		const messagesWithImage = [...messages, imageMessage]

		renderWithMessages({
			currentUserId,
			rooms,
			messages: messagesWithImage,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText('Check out these plans!')).toBeVisible()
		const msgEl = locateBySelector('#msg-image')
		await expect.element(msgEl).toMatchScreenshot('message-with-image')
	})

	it('message with file', async () => {
		const messagesWithFile = [...messages, fileMessage]

		renderWithMessages({
			currentUserId,
			rooms,
			messages: messagesWithFile,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText('mission-briefing.pdf')).toBeVisible()
		const msgEl = locateBySelector('#msg-file')
		await expect.element(msgEl).toMatchScreenshot('message-with-file')
	})

	it('message with audio', async () => {
		const messagesWithAudio = [...messages, audioMessage]

		renderWithMessages({
			currentUserId,
			rooms,
			messages: messagesWithAudio,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText('Hey Leia, how are you?')).toBeVisible()
		const msgEl = locateBySelector('#msg-audio')
		await expect.element(msgEl).toMatchScreenshot('message-with-audio')
	})

	it('upload progress bar', async () => {
		const messagesWithUpload = [...messages, uploadingImageMessage]

		renderWithMessages({
			currentUserId,
			rooms,
			messages: messagesWithUpload,
			roomsLoaded: true,
			roomId: 'room-1',
			singleRoom: true,
			height: '500px',
		})

		await expect.element(page.getByText('Uploading a photo...')).toBeVisible()
		const msgEl = locateBySelector('#msg-upload')
		await expect.element(msgEl).toMatchScreenshot('upload-progress-bar')
	})

	it('rooms list', async () => {
		render(ChatWindow, {
			props: {
				currentUserId,
				rooms,
				messages: [],
				roomsLoaded: true,
				loadFirstRoom: false,
				height: '500px',
			},
		})

		await expect.element(page.getByText('Yoda').first()).toBeVisible()
		const roomsList = locateBySelector('.vac-rooms-container')
		await expect.element(roomsList).toMatchScreenshot('rooms-list')
	})
})
