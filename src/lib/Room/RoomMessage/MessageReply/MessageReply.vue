<script setup lang="ts">
import type { LinkOptions, Message, MessageFile, RoomUser, TextFormatting } from '@/types'

import { computed } from 'vue'
import FormatMessage from '../../../../components/FormatMessage/FormatMessage.vue'

import SvgIcon from '../../../../components/SvgIcon/SvgIcon.vue'

import {
	isAudioFile,
	isImageFile,
	isVideoFile,
} from '../../../../utils/media-file'

import AudioPlayer from '../AudioPlayer/AudioPlayer.vue'

const props = defineProps<{
	message: Message
	textFormatting: TextFormatting
	linkOptions: LinkOptions
	roomUsers: RoomUser[]
}>()

const replyUsername = computed(() => {
	const { senderId } = props.message.replyMessage!
	const replyUser = props.roomUsers.find(user => user._id === senderId)
	return replyUser ? replyUser.username : ''
})

const firstFile = computed(() => {
	return (props.message.replyMessage?.files?.length
		? props.message.replyMessage.files[0]
		: {}) as MessageFile
})

const isAudio = computed(() => isAudioFile(firstFile.value))
const isImage = computed(() => isImageFile(firstFile.value))
const isVideo = computed(() => isVideoFile(firstFile.value))

const isOtherFile = computed(() => {
	return (
		props.message.replyMessage?.files?.length
		&& !isAudio.value
		&& !isVideo.value
		&& !isImage.value
	)
})
</script>

<template>
	<div class="vac-reply-message">
		<div class="vac-reply-username">
			{{ replyUsername }}
		</div>

		<div v-if="isImage" class="vac-image-reply-container">
			<div
				class="vac-message-image vac-message-image-reply"
				:style="{
					'background-image': `url('${firstFile.url}')`,
				}"
			/>
		</div>

		<div v-else-if="isVideo" class="vac-video-reply-container">
			<video controls>
				<source :src="firstFile.url">
			</video>
		</div>

		<AudioPlayer
			v-else-if="isAudio"
			:src="firstFile.url"
			:message-selection-enabled="false"
		>
			<template v-for="(idx, name) in $slots" #[name]="data">
				<slot :name="name" v-bind="data" />
			</template>
		</AudioPlayer>

		<div v-else-if="isOtherFile" class="vac-file-container">
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

		<div class="vac-reply-content">
			<FormatMessage
				:message-id="message.replyMessage?._id"
				:content="message.replyMessage?.content ?? ''"
				:users="roomUsers"
				:text-formatting="textFormatting"
				:link-options="linkOptions"
				:reply="true"
			/>
		</div>
	</div>
</template>
