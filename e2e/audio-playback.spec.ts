import { describe, expect, it } from 'vitest'

describe('audio playback backwards compatibility', () => {
	it('can load and play an MP3 file', async () => {
		const audio = new Audio('/sample.mp3')

		await new Promise<void>((resolve, reject) => {
			audio.addEventListener('canplaythrough', () => resolve(), { once: true })
			audio.addEventListener('error', () => reject(new Error(`Failed to load MP3: ${audio.error?.message}`)), { once: true })
			audio.load()
		})

		expect(audio.duration).toBeGreaterThan(0)
		expect(audio.readyState).toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_ENOUGH_DATA)
	})

	it('can record audio via MediaRecorder', async () => {
		const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
			? 'audio/webm;codecs=opus'
			: 'audio/ogg;codecs=opus'

		const ctx = new AudioContext()
		const oscillator = ctx.createOscillator()
		const dest = ctx.createMediaStreamDestination()
		oscillator.connect(dest)
		oscillator.start()

		const recorder = new MediaRecorder(dest.stream, { mimeType })
		const chunks: Blob[] = []

		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data)
		}

		const blob = await new Promise<Blob>((resolve) => {
			recorder.onstop = () => {
				resolve(new Blob(chunks, { type: mimeType }))
			}
			recorder.start()
			setTimeout(() => {
				recorder.stop()
				oscillator.stop()
				ctx.close()
			}, 500)
		})

		expect(blob.size).toBeGreaterThan(0)
		expect(blob.type).toBe(mimeType)
	})
})
