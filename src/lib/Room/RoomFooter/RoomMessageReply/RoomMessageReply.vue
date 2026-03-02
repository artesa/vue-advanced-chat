<script setup lang="ts">
import type {
	LinkOptions,
	Message,
	MessageFile,
	Room,
	TextFormatting,
} from '@/types'

import { computed } from 'vue'
import FormatMessage from '@/components/FormatMessage/FormatMessage.vue'

import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'

import {
	isAudioFile,
	isImageFile,
	isVideoFile,
} from '@/utils/media-file'

import AudioPlayer from '../../RoomMessage/AudioPlayer/AudioPlayer.vue'

const props = withDefaults(
	defineProps<{
		room: Room
		messageReply?: Message | null
		textFormatting: TextFormatting
		linkOptions: LinkOptions
	}>(),
	{
		messageReply: null,
	},
)

defineEmits<{
	'reset-message': []
}>()

const firstFile = computed(() => {
	return (props.messageReply?.files?.length ? props.messageReply.files[0] : {}) as MessageFile
})

const isImage = computed(() => {
	return isImageFile(firstFile.value)
})

const isVideo = computed(() => {
	return isVideoFile(firstFile.value)
})

const isAudio = computed(() => {
	return isAudioFile(firstFile.value)
})

const isOtherFile = computed(() => {
	return (
		props.messageReply?.files?.length
		&& !isAudio.value
		&& !isVideo.value
		&& !isImage.value
	)
})
</script>

<template>
	<transition name="vac-slide-up">
		<div
			v-if="messageReply"
			class="vac-reply-container"
		>
			<div class="vac-reply-box">
				<div class="vac-reply-info">
					<div class="vac-reply-username">
						{{ messageReply.username }}
					</div>
					<div class="vac-reply-content">
						<FormatMessage
							:message-id="messageReply._id"
							:content="messageReply.content ?? ''"
							:users="room.users"
							:text-formatting="textFormatting"
							:link-options="linkOptions"
							:reply="true"
						/>
					</div>
				</div>

				<img v-if="isImage" :src="firstFile.url" class="vac-image-reply">

				<video v-else-if="isVideo" controls class="vac-image-reply">
					<source :src="firstFile.url">
				</video>

				<AudioPlayer
					v-else-if="isAudio"
					:src="firstFile.url"
					:message-selection-enabled="false"
					class="vac-audio-reply"
				>
					<template v-for="(idx, name) in $slots" #[name]="data">
						<slot :name="name" v-bind="data" />
					</template>
				</AudioPlayer>

				<div v-else-if="isOtherFile" class="vac-image-reply vac-file-container">
					<div>
						<slot name="file-icon">
							<SvgIcon name="file" />
						</slot>
					</div>
					<div class="vac-text-ellipsis">
						{{ firstFile.name }}
					</div>
					<div
						v-if="firstFile.extension"
						class="vac-text-ellipsis vac-text-extension"
					>
						{{ firstFile.extension }}
					</div>
				</div>
			</div>

			<div class="vac-icon-reply">
				<div class="vac-svg-button" @click="$emit('reset-message')">
					<slot name="reply-close-icon">
						<SvgIcon name="close-outline" />
					</slot>
				</div>
			</div>
		</div>
	</transition>
</template>
