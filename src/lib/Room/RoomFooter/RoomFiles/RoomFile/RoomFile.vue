<script setup lang="ts">
import type { MessageFile } from '@/types'

import { computed } from 'vue'
import Loader from '../../../../../components/Loader/Loader.vue'

import SvgIcon from '../../../../../components/SvgIcon/SvgIcon.vue'

import { isImageFile, isVideoFile } from '../../../../../utils/media-file'

const props = defineProps<{
	file: MessageFile & { loading?: boolean }
	index: number
}>()

defineEmits<{
	'remove-file': [index: number]
}>()

const isImage = computed(() => isImageFile(props.file))
const isVideo = computed(() => isVideoFile(props.file))
</script>

<template>
	<div class="vac-room-file-container">
		<Loader :show="file.loading" type="room-file">
			<template v-for="(idx, name) in $slots" #[name]="data">
				<slot :name="name" v-bind="data" />
			</template>
		</Loader>

		<div
			class="vac-svg-button vac-icon-remove"
			@click="$emit('remove-file', index)"
		>
			<slot name="image-close-icon">
				<SvgIcon name="close" param="image" />
			</slot>
		</div>

		<div
			v-if="isImage"
			class="vac-message-image"
			:class="{ 'vac-blur-loading': file.loading }"
			:style="{
				'background-image': `url('${file.localUrl || file.url}')`,
			}"
		/>

		<video
			v-else-if="isVideo"
			controls
			:class="{ 'vac-blur-loading': file.loading }"
		>
			<source :src="file.localUrl || file.url">
		</video>

		<div
			v-else
			class="vac-file-container"
			:class="{ 'vac-blur-loading': file.loading }"
		>
			<div>
				<slot name="file-icon">
					<SvgIcon name="file" />
				</slot>
			</div>
			<div class="vac-text-ellipsis">
				{{ file.name }}
			</div>
			<div v-if="file.extension" class="vac-text-ellipsis vac-text-extension">
				{{ file.extension }}
			</div>
		</div>
	</div>
</template>
