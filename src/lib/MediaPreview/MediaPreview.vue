<script setup lang="ts">
import type { MessageFile } from '@/types'

import { computed, onMounted, useTemplateRef } from 'vue'

import SvgIcon from '../../components/SvgIcon/SvgIcon.vue'

import { isImageFile, isVideoFile } from '../../utils/media-file'

const props = defineProps<{
	file: MessageFile
}>()

const emit = defineEmits<{
	'close-media-preview': []
}>()

const modal = useTemplateRef<HTMLElement>('modal')

const isImage = computed(() => isImageFile(props.file))
const isVideo = computed(() => isVideoFile(props.file))

onMounted(() => {
	modal.value?.focus()
})

function closeModal() {
	emit('close-media-preview')
}
</script>

<template>
	<div
		ref="modal"
		tabindex="0"
		class="vac-media-preview"
		@click.stop="closeModal"
		@keydown.esc="closeModal"
	>
		<transition name="vac-bounce-preview" appear>
			<div v-if="isImage" class="vac-media-preview-container">
				<div
					class="vac-image-preview"
					:style="{
						'background-image': `url('${file.url}')`,
					}"
				/>
			</div>

			<div v-else-if="isVideo" class="vac-media-preview-container">
				<video controls autoplay>
					<source :src="file.url">
				</video>
			</div>
		</transition>

		<div class="vac-svg-button">
			<slot name="preview-close-icon">
				<SvgIcon name="close-outline" param="preview" />
			</slot>
		</div>
	</div>
</template>
