<script setup lang="ts">
import type { MessageFile } from '@/types'

import SvgIcon from '../../../../components/SvgIcon/SvgIcon.vue'

import RoomFile from './RoomFile/RoomFile.vue'

defineProps<{
	files: MessageFile[]
}>()

defineEmits<{
	'remove-file': [index: number]
	'reset-message': []
}>()
</script>

<template>
	<transition name="vac-slide-up">
		<div
			v-if="files.length"
			class="vac-room-files-container"
		>
			<div class="vac-files-box">
				<div v-for="(file, i) in files" :key="i">
					<RoomFile
						:file="file"
						:index="i"
						@remove-file="$emit('remove-file', $event)"
					>
						<template v-for="(idx, name) in $slots" #[name]="data">
							<slot :name="name" v-bind="data" />
						</template>
					</RoomFile>
				</div>
			</div>

			<div class="vac-icon-close">
				<div class="vac-svg-button" @click="$emit('reset-message')">
					<slot name="files-close-icon">
						<SvgIcon name="close-outline" />
					</slot>
				</div>
			</div>
		</div>
	</transition>
</template>
