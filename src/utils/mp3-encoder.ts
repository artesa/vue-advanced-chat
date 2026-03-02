// Credits to https://github.com/grishkovelli/vue-audio-recorder

import { Mp3Encoder } from './lamejs'

interface Mp3EncoderConfig {
	bitRate: number
	sampleRate: number
}

interface Mp3EncoderResult {
	id: number
	blob: Blob
	url: string
}

export default class {
	private bitRate: number
	private sampleRate: number
	private dataBuffer: Int8Array[]
	private encoder: any

	constructor(config: Mp3EncoderConfig) {
		this.bitRate = config.bitRate
		this.sampleRate = config.sampleRate
		this.dataBuffer = []
		this.encoder = new Mp3Encoder(1, this.sampleRate, this.bitRate)
	}

	encode(arrayBuffer: ArrayBuffer | Float32Array): void {
		const maxSamples = 1152
		const samples = this._convertBuffer(arrayBuffer)
		let remaining = samples.length

		for (let i = 0; remaining >= 0; i += maxSamples) {
			const left = samples.subarray(i, i + maxSamples)
			const buffer = this.encoder.encodeBuffer(left)
			this.dataBuffer.push(new Int8Array(buffer))
			remaining -= maxSamples
		}
	}

	finish(): Mp3EncoderResult {
		this.dataBuffer.push(this.encoder.flush())
		const blob = new Blob(this.dataBuffer as BlobPart[], { type: 'audio/mp3' })
		this.dataBuffer = []

		return {
			id: Date.now(),
			blob,
			url: URL.createObjectURL(blob),
		}
	}

	private _floatTo16BitPCM(input: Float32Array, output: Int16Array): void {
		for (let i = 0; i < input.length; i++) {
			const s = Math.max(-1, Math.min(1, input[i]))
			output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
		}
	}

	private _convertBuffer(arrayBuffer: ArrayBuffer | Float32Array): Int16Array {
		const data = arrayBuffer instanceof Float32Array ? arrayBuffer : new Float32Array(arrayBuffer)
		const out = new Int16Array(arrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT)
		this._floatTo16BitPCM(data, out)
		return out
	}
}
