// Credits to https://github.com/grishkovelli/vue-audio-recorder

import Mp3Encoder from './mp3-encoder'

declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext
	}
}

export interface RecorderOptions {
	beforeRecording?: (message: string) => void
	pauseRecording?: (message: string) => void
	afterRecording?: (record: RecordResult) => void
	micFailed?: (error: Error) => void
	bitRate?: number
	sampleRate?: number
}

export interface RecordResult {
	id: number
	blob: Blob
	url: string
	duration: number
}

export default class {
	private beforeRecording?: (message: string) => void
	private pauseRecording?: (message: string) => void
	private afterRecording?: (record: RecordResult) => void
	private micFailed?: (error: Error) => void

	private encoderOptions: {
		bitRate: number | undefined
		sampleRate: number | undefined
	}

	private bufferSize: number
	records: RecordResult[]

	isPause: boolean
	isRecording: boolean

	duration: number
	volume: number | string

	private _duration: number

	private context!: AudioContext
	private input!: MediaStreamAudioSourceNode
	private processor!: ScriptProcessorNode
	private stream!: MediaStream
	private lameEncoder!: Mp3Encoder

	constructor(options: RecorderOptions = {}) {
		this.beforeRecording = options.beforeRecording
		this.pauseRecording = options.pauseRecording
		this.afterRecording = options.afterRecording
		this.micFailed = options.micFailed

		this.encoderOptions = {
			bitRate: options.bitRate,
			sampleRate: options.sampleRate,
		}

		this.bufferSize = 4096
		this.records = []

		this.isPause = false
		this.isRecording = false

		this.duration = 0
		this.volume = 0

		this._duration = 0
	}

	start(): void {
		const constraints: MediaStreamConstraints = {
			video: false,
			audio: {
				channelCount: 1,
				echoCancellation: false,
			},
		}

		this.beforeRecording && this.beforeRecording('start recording')

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(this._micCaptured.bind(this))
			.catch(this._micError.bind(this))

		this.isPause = false
		this.isRecording = true
	}

	stop(): void {
		this.stream.getTracks().forEach(track => track.stop())
		this.input.disconnect()
		this.processor.disconnect()
		this.context.close()

		const record = this.lameEncoder.finish() as RecordResult

		record.duration = this.duration
		this.records.push(record)

		this._duration = 0
		this.duration = 0

		this.isPause = false
		this.isRecording = false

		this.afterRecording && this.afterRecording(record)
	}

	pause(): void {
		this.stream.getTracks().forEach(track => track.stop())
		this.input.disconnect()
		this.processor.disconnect()

		this._duration = this.duration
		this.isPause = true

		this.pauseRecording && this.pauseRecording('pause recording')
	}

	private _micCaptured(stream: MediaStream): void {
		this.context = new (window.AudioContext || window.webkitAudioContext)()
		this.duration = this._duration
		this.input = this.context.createMediaStreamSource(stream)
		this.processor = this.context.createScriptProcessor(this.bufferSize, 1, 1)
		this.stream = stream

		const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate

		if (sampleRate !== this.encoderOptions.sampleRate) {
			this.encoderOptions.sampleRate = stream
				.getAudioTracks()[0]
				.getSettings()
				.sampleRate

			this.lameEncoder = new Mp3Encoder(this.encoderOptions as { bitRate: number, sampleRate: number })
		}

		if (!this.lameEncoder) {
			this.lameEncoder = new Mp3Encoder(this.encoderOptions as { bitRate: number, sampleRate: number })
		}

		this.processor.onaudioprocess = (ev: AudioProcessingEvent) => {
			const sample = ev.inputBuffer.getChannelData(0)
			let sum = 0.0

			if (this.lameEncoder) {
				this.lameEncoder.encode(sample)
			}

			for (let i = 0; i < sample.length; ++i) {
				sum += sample[i] * sample[i]
			}

			this.duration
				= Number.parseFloat(String(this._duration))
					+ Number.parseFloat(this.context.currentTime.toFixed(2))
			this.volume = Math.sqrt(sum / sample.length).toFixed(2)
		}

		this.input.connect(this.processor)
		this.processor.connect(this.context.destination)
	}

	private _micError(error: Error): void {
		this.micFailed && this.micFailed(error)
	}
}
