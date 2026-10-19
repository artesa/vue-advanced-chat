<script setup lang="ts">
import type { Message, MessageFile, StringNumber } from '@/types'

import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'

import Loader from '@/components/Loader/Loader.vue'
import ProgressBar from '@/components/ProgressBar/ProgressBar.vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'

import { isImageFile, isVideoFile } from '@/utils/media-file'

const props = defineProps<{
	currentUserId: StringNumber
	message: Message
	file: MessageFile
	index: number
	messageSelectionEnabled: boolean
}>()

const emit = defineEmits<{
	'open-file': [{ file: MessageFile, action: string }]
}>()

const imageResponsive = ref({ maxHeight: 0, loaderTop: 0 })
// only while the browser loads it: an upload shows its progress, and a blob: url may be a
// finished file the app keeps on the device
const imageLoading = ref(false)
const imageHover = ref(false)

const imageRef = useTemplateRef('imageRef')

const isImage = computed(() => {
	return isImageFile(props.file)
})

const isVideo = computed(() => {
	return isVideoFile(props.file)
})

watch(
	() => props.file,
	() => {
		checkImgLoad()
	},
	{ immediate: true },
)

onMounted(() => {
	if (imageRef.value) {
		imageResponsive.value = {
			maxHeight: imageRef.value.clientWidth - 18,
			loaderTop: imageRef.value.clientHeight / 2 - 9,
		}
	}
})

function checkImgLoad() {
	if (!isImageFile(props.file))
    return
	imageLoading.value = true
	const image = new Image()
	image.src = props.file.url
	image.addEventListener('load', () => (imageLoading.value = false))
}

function openFile(event: Event, action: string) {
	if (!props.messageSelectionEnabled) {
		event.stopPropagation()
		emit('open-file', { file: props.file, action })
	}
}
</script>

<template>
	<div class="vac-message-file-container">
		<div
			v-if="isImage"
			ref="imageRef"
			class="vac-message-image-container"
			@mouseover="imageHover = true"
			@mouseleave="imageHover = false"
			@click="openFile($event, 'preview')"
		>
			<progress-bar
				v-if="file.progress != null && file.progress >= 0"
				:progress="file.progress"
				:style="{ top: `${imageResponsive.loaderTop}px` }"
			/>
			<loader
				v-else
				:show="imageLoading"
				type="message-file"
				:message-id="message._id"
			>
				<template v-for="(idx, name) in $slots" #[name]="data">
					<slot :name="name" v-bind="data" />
				</template>
			</loader>
			<div
				class="vac-message-image"
				:class="{
					'vac-blur-loading':
						imageLoading && message.senderId === currentUserId,
				}"
				:style="{
					'background-image': `url('${
						imageLoading ? file.preview || file.url : file.url
					}')`,
					'max-height': `${imageResponsive.maxHeight}px`,
				}"
			>
				<transition name="vac-fade-image">
					<div
						v-if="!messageSelectionEnabled && imageHover && !imageLoading"
						class="vac-image-buttons"
					>
						<div
							class="vac-svg-button vac-button-view"
							@click="openFile($event, 'preview')"
						>
							<slot :name="'eye-icon_' + message._id">
								<svg-icon name="eye" />
							</slot>
						</div>
						<div
							class="vac-svg-button vac-button-download"
							@click="openFile($event, 'download')"
						>
							<slot :name="'document-icon_' + message._id">
								<svg-icon name="document" />
							</slot>
						</div>
					</div>
				</transition>
			</div>
		</div>

		<div
			v-else-if="isVideo"
			class="vac-video-container"
			@click.prevent="openFile($event, 'preview')"
		>
			<progress-bar v-if="file.progress != null && file.progress >= 0" :progress="file.progress" />
			<video controls>
				<source :src="file.url" />
			</video>
		</div>
	</div>
</template>
