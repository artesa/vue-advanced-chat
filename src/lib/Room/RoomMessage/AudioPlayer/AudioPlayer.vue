<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'

import SvgIcon from '../../../../components/SvgIcon/SvgIcon.vue'

import AudioControl from './AudioControl/AudioControl.vue'

const props = withDefaults(defineProps<{
	messageId?: string | number | null
	src?: string | null
	messageSelectionEnabled: boolean
}>(), {
	messageId: null,
	src: null,
})

const emit = defineEmits<{
	'hover-audio-progress': [event: unknown]
	'update-progress-time': [time: string]
}>()

function convertTimeMMSS(seconds: number) {
	return new Date(seconds * 1000).toISOString().substr(14, 5)
}

const isPlaying = ref(false)
const duration = ref(convertTimeMMSS(0))
const playedTime = ref(convertTimeMMSS(0))
const progress = ref(0)

let player: HTMLAudioElement | null = null

const rootEl = useTemplateRef<HTMLElement>('rootEl')

const playerUniqId = computed(() => `audio-player${props.messageId}`)

const audioSource = computed(() => {
	if (props.src)
		return props.src
	resetProgress()
	return undefined
})

onMounted(() => {
	player = rootEl.value?.querySelector<HTMLAudioElement>(`#${playerUniqId.value}`) ?? null

	if (!player)
		return

	player.addEventListener('ended', () => {
		isPlaying.value = false
	})

	player.addEventListener('loadeddata', () => {
		resetProgress()
		duration.value = convertTimeMMSS(player!.duration)
		updateProgressTime()
	})

	player.addEventListener('timeupdate', onTimeUpdate)
})

function playback() {
	if (props.messageSelectionEnabled || !audioSource.value)
		return

	if (isPlaying.value)
		player?.pause()
	else setTimeout(() => player?.play())

	isPlaying.value = !isPlaying.value
}

function resetProgress() {
	if (isPlaying.value)
		player?.pause()

	duration.value = convertTimeMMSS(0)
	playedTime.value = convertTimeMMSS(0)
	progress.value = 0
	isPlaying.value = false
	updateProgressTime()
}

function onTimeUpdate() {
	if (!player)
		return
	playedTime.value = convertTimeMMSS(player.currentTime)
	progress.value = (player.currentTime / player.duration) * 100
	updateProgressTime()
}

function onUpdateProgress(pos: number) {
	if (pos && player)
		player.currentTime = pos * player.duration
}

function updateProgressTime() {
	emit(
		'update-progress-time',
		progress.value > 1 ? playedTime.value : duration.value,
	)
}
</script>

<template>
	<div ref="rootEl">
		<div class="vac-audio-player">
			<div class="vac-svg-button" @click="playback">
				<slot v-if="isPlaying" :name="`audio-pause-icon_${messageId}`">
					<SvgIcon name="audio-pause" />
				</slot>
				<slot v-else :name="`audio-play-icon_${messageId}`">
					<SvgIcon name="audio-play" />
				</slot>
			</div>
			<AudioControl
				:percentage="progress"
				:message-selection-enabled="messageSelectionEnabled"
				@change-linehead="onUpdateProgress"
				@hover-audio-progress="$emit('hover-audio-progress', $event)"
			/>

			<audio :id="playerUniqId" :src="audioSource" />
		</div>
	</div>
</template>
