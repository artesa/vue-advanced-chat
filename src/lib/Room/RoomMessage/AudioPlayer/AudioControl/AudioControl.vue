<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

const props = defineProps<{
	percentage: number
	messageSelectionEnabled: boolean
}>()

const emit = defineEmits<{
	'hover-audio-progress': [value: boolean]
	'change-linehead': [position: number]
}>()

const isMouseDown = ref(false)
const progress = useTemplateRef<HTMLDivElement>('progress')

function calculateLineHeadPosition(ev: MouseEvent, element: HTMLDivElement) {
	const progressWidth = element.getBoundingClientRect().width
	const leftPosition = element.getBoundingClientRect().left
	let pos = (ev.clientX - leftPosition) / progressWidth

	pos = pos < 0 ? 0 : pos
	pos = pos > 1 ? 1 : pos

	return pos
}

function onMouseMove(ev: MouseEvent) {
	if (props.messageSelectionEnabled)
		return

	const seekPos = calculateLineHeadPosition(ev, progress.value!)
	emit('change-linehead', seekPos)
}

function onMouseUp(ev: MouseEvent) {
	if (props.messageSelectionEnabled)
		return

	isMouseDown.value = false
	document.removeEventListener('mouseup', onMouseUp)
	document.removeEventListener('mousemove', onMouseMove)
	const seekPos = calculateLineHeadPosition(ev, progress.value!)
	emit('change-linehead', seekPos)
}

function onMouseDown(ev: MouseEvent) {
	if (props.messageSelectionEnabled)
		return

	isMouseDown.value = true
	const seekPos = calculateLineHeadPosition(ev, progress.value!)
	emit('change-linehead', seekPos)
	document.addEventListener('mousemove', onMouseMove)
	document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
	<div
		ref="progress"
		class="vac-player-bar"
		@mousedown="onMouseDown"
		@mouseover="$emit('hover-audio-progress', true)"
		@mouseout="$emit('hover-audio-progress', false)"
	>
		<div class="vac-player-progress">
			<div class="vac-line-container">
				<div class="vac-line-progress" :style="{ width: `${percentage}%` }" />
				<div
					class="vac-line-dot"
					:class="{ 'vac-line-dot__active': isMouseDown }"
					:style="{ left: `${percentage}%` }"
				/>
			</div>
		</div>
	</div>
</template>
