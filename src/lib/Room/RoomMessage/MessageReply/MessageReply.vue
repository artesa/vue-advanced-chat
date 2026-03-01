<script>
import FormatMessage from '../../../../components/FormatMessage/FormatMessage'
import SvgIcon from '../../../../components/SvgIcon/SvgIcon'

import {
	isAudioFile,
	isImageFile,
	isVideoFile,
} from '../../../../utils/media-file'

import AudioPlayer from '../AudioPlayer/AudioPlayer'

export default {
	name: 'MessageReply',
	components: { AudioPlayer, SvgIcon, FormatMessage },

	props: {
		message: { type: Object, required: true },
		textFormatting: { type: Object, required: true },
		linkOptions: { type: Object, required: true },
		roomUsers: { type: Array, required: true },
	},

	computed: {
		replyUsername() {
			const { senderId } = this.message.replyMessage
			const replyUser = this.roomUsers.find(user => user._id === senderId)
			return replyUser ? replyUser.username : ''
		},
		firstFile() {
			return this.message.replyMessage?.files?.length
				? this.message.replyMessage.files[0]
				: {}
		},
		isAudio() {
			return isAudioFile(this.firstFile)
		},
		isImage() {
			return isImageFile(this.firstFile)
		},
		isVideo() {
			return isVideoFile(this.firstFile)
		},
		isOtherFile() {
			return (
				this.message.replyMessage.files?.length
				&& !this.isAudio
				&& !this.isVideo
				&& !this.isImage
			)
		},
	},
}
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
			@update-progress-time="progressTime = $event"
			@hover-audio-progress="hoverAudioProgress = $event"
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
				:message-id="message.replyMessage._id"
				:content="message.replyMessage.content"
				:users="roomUsers"
				:text-formatting="textFormatting"
				:link-options="linkOptions"
				:reply="true"
			/>
		</div>
	</div>
</template>
