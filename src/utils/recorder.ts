export interface RecorderOptions {
	micFailed?: (error: Error) => void
}

export interface RecordResult {
	id: number
	blob: Blob
	url: string
	duration: number
}

function getSupportedMimeType(): string {
	const types = [
		'audio/webm;codecs=opus',
		'audio/ogg;codecs=opus',
		'audio/webm',
	]
	for (const type of types) {
		if (MediaRecorder.isTypeSupported(type))
			return type
	}
	return ''
}

export function mimeToExtension(mimeType: string): string {
	if (mimeType.includes('webm'))
		return 'webm'
	if (mimeType.includes('ogg'))
		return 'ogg'
	return 'webm'
}

export default class {
	private micFailed?: (error: Error) => void
	private chunks: Blob[] = []
	private stream: MediaStream | null = null
	private mediaRecorder: MediaRecorder | null = null
	private startTime = 0
	private pausedDuration = 0
	private analyser: AnalyserNode | null = null
	private context: AudioContext | null = null
	private animationFrame = 0

	records: RecordResult[] = []
	isPause = false
	isRecording = false
	duration = 0
	volume: number | string = 0
	mimeType = ''

	constructor(options: RecorderOptions = {}) {
		this.micFailed = options.micFailed
		this.mimeType = getSupportedMimeType()
	}

	start(): void {
		const constraints: MediaStreamConstraints = {
			video: false,
			audio: {
				channelCount: 1,
				echoCancellation: false,
			},
		}

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(this._micCaptured.bind(this))
			.catch(this._micError.bind(this))

		this.isPause = false
		this.isRecording = true
	}

	stop(): Promise<void> {
		return new Promise<void>((resolve) => {
			if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
				this._cleanup()
				resolve()
				return
			}

			const originalOnStop = this.mediaRecorder.onstop
			this.mediaRecorder.onstop = (ev) => {
				if (originalOnStop) {
					(originalOnStop as (ev: Event) => void)(ev)
				}
				this._cleanup()
				resolve()
			}

			this.mediaRecorder.stop()
		})
	}

	private _cleanup(): void {
		this.stream?.getTracks().forEach(track => track.stop())
		this._stopVolumeTracking()

		this.isPause = false
		this.isRecording = false
	}

	pause(): void {
		if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
			this.mediaRecorder.pause()
			this.pausedDuration += (Date.now() - this.startTime) / 1000
			this.stream?.getTracks().forEach(track => track.stop())
			this._stopVolumeTracking()
			this.isPause = true
		}
	}

	private _micCaptured(stream: MediaStream): void {
		this.stream = stream
		this.chunks = []

		if (!this.isPause) {
			this.startTime = Date.now()
			this.pausedDuration = 0
		}
		else {
			this.startTime = Date.now()
		}

		const options: MediaRecorderOptions = {}
		if (this.mimeType)
			options.mimeType = this.mimeType

		this.mediaRecorder = new MediaRecorder(stream, options)

		this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
			if (e.data.size > 0)
				this.chunks.push(e.data)
		}

		this.mediaRecorder.onstop = () => {
			const finalDuration = this.pausedDuration + (Date.now() - this.startTime) / 1000
			const blobType = (this.mimeType || this.mediaRecorder?.mimeType || 'audio/webm').split(';')[0]
			const blob = new Blob(this.chunks, { type: blobType })

			const record: RecordResult = {
				id: Date.now(),
				blob,
				url: URL.createObjectURL(blob),
				duration: Number.parseFloat(finalDuration.toFixed(2)),
			}

			this.records = [record]
			this.duration = record.duration
		}

		this.mediaRecorder.start()

		// Set up volume tracking via AnalyserNode
		this.context = new AudioContext()
		const source = this.context.createMediaStreamSource(stream)
		this.analyser = this.context.createAnalyser()
		this.analyser.fftSize = 2048
		source.connect(this.analyser)
		this._trackVolume()
	}

	private _trackVolume(): void {
		if (!this.analyser)
			return

		const data = new Float32Array(this.analyser.fftSize)
		this.analyser.getFloatTimeDomainData(data)

		let sum = 0
		for (let i = 0; i < data.length; i++) {
			sum += data[i] * data[i]
		}
		this.volume = Math.sqrt(sum / data.length).toFixed(2)
		this.duration = this.pausedDuration + (Date.now() - this.startTime) / 1000
		this.duration = Number.parseFloat(this.duration.toFixed(2))

		this.animationFrame = requestAnimationFrame(() => this._trackVolume())
	}

	private _stopVolumeTracking(): void {
		cancelAnimationFrame(this.animationFrame)
		this.context?.close()
		this.context = null
		this.analyser = null
	}

	private _micError(error: Error): void {
		this.micFailed?.(error)
	}
}
