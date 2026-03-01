<script>
import FormatMessage from '../../../../components/FormatMessage/FormatMessage'
import ProgressBar from '../../../../components/ProgressBar/ProgressBar'
import SvgIcon from '../../../../components/SvgIcon/SvgIcon'

import { isImageVideoFile } from '../../../../utils/media-file'

import MessageFile from './MessageFile/MessageFile'

export default {
	name: 'MessageFiles',
	components: { SvgIcon, FormatMessage, ProgressBar, MessageFile },

	props: {
		currentUserId: { type: [String, Number], required: true },
		message: { type: Object, required: true },
		roomUsers: { type: Array, required: true },
		textFormatting: { type: Object, required: true },
		linkOptions: { type: Object, required: true },
		messageSelectionEnabled: { type: Boolean, required: true },
	},

	emits: ['open-file', 'open-user-tag'],

	computed: {
		imageVideoFiles() {
			return this.message.files.filter(file => isImageVideoFile(file))
		},
		otherFiles() {
			return this.message.files.filter(file => !isImageVideoFile(file))
		},
	},

	methods: {
		openFile(event, file, action) {
			if (!this.messageSelectionEnabled) {
				event.stopPropagation()
				this.$emit('open-file', { file, action })
			}
		},
	},
}
</script>

<template>
	<div class="vac-message-files-container">
		<div v-for="(file, i) in imageVideoFiles" :key="`${i}iv`">
			<MessageFile
				:file="file"
				:current-user-id="currentUserId"
				:message="message"
				:index="i"
				:message-selection-enabled="messageSelectionEnabled"
				@open-file="$emit('open-file', $event)"
			>
				<template v-for="(idx, name) in $slots" #[name]="data">
					<slot :name="name" v-bind="data" />
				</template>
			</MessageFile>
		</div>

		<div
			v-for="(file, i) in otherFiles"
			:key="`${i}a`"
			class="vac-file-wrapper"
		>
			<ProgressBar
				v-if="file.progress >= 0"
				:progress="file.progress"
				:style="{ top: '44px' }"
			/>
			<div
				class="vac-file-container"
				:class="{ 'vac-file-container-progress': file.progress >= 0 }"
				@click="openFile($event, file, 'download')"
			>
				<div class="vac-svg-button">
					<slot name="document-icon">
						<SvgIcon name="document" />
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

		<FormatMessage
			:message-id="message._id"
			:content="message.content"
			:users="roomUsers"
			:text-formatting="textFormatting"
			:link-options="linkOptions"
			@open-user-tag="$emit('open-user-tag', $event)"
		/>
	</div>
</template>
