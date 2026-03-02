import type { MessageFile } from '@/types'
import { AUDIO_TYPES, IMAGE_TYPES, VIDEO_TYPES } from './constants'

function checkMediaType(types: readonly string[], file: MessageFile): boolean {
	if (!file || !file.type)
		return false
	return types.some(t => file.type.toLowerCase().includes(t))
}

export function isImageFile(file: MessageFile): boolean {
	return checkMediaType(IMAGE_TYPES, file)
}

export function isVideoFile(file: MessageFile): boolean {
	return checkMediaType(VIDEO_TYPES, file)
}

export function isImageVideoFile(file: MessageFile): boolean {
	return checkMediaType(IMAGE_TYPES, file) || checkMediaType(VIDEO_TYPES, file)
}

export function isAudioFile(file: MessageFile): boolean {
	return checkMediaType(AUDIO_TYPES, file)
}
