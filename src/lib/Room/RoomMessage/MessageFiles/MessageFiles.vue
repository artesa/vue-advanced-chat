<script setup lang="ts">
import type {
	LinkOptions,
	Message,
	MessageFile as MessageFileType,
	MessageOpenFileEvent,
	OpenFileAction,
	RoomUser,
	TextFormatting
} from '@/types'

import { computed } from 'vue'
import FormatMessage from '@/components/FormatMessage/FormatMessage.vue'
import ProgressBar from '@/components/ProgressBar/ProgressBar.vue'

import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'

import { isImageVideoFile } from '@/utils/media-file'

import MessageFile from './MessageFile/MessageFile.vue'

const props = defineProps<{
	currentUserId: string | number
	message: Message
	roomUsers: RoomUser[]
	textFormatting: TextFormatting
	linkOptions: LinkOptions
	messageSelectionEnabled: boolean
}>()

const emit = defineEmits<{
	'open-file': [payload: MessageOpenFileEvent]
	'open-user-tag': [user: RoomUser | undefined]
}>()

const imageVideoFiles = computed(() => {
	return props.message.files!.filter(file => isImageVideoFile(file))
})

const otherFiles = computed(() => {
	return props.message.files!.filter(file => !isImageVideoFile(file))
})

function openFile(
	event: Event,
	file: MessageFileType,
	action: OpenFileAction
): void {
	if (!props.messageSelectionEnabled) {
		event.stopPropagation()
		emit('open-file', { file, action })
	}
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
				v-if="file.progress != null && file.progress >= 0"
				:progress="file.progress"
				:style="{ top: '44px' }"
			/>
			<div
				class="vac-file-container"
				:class="{
					'vac-file-container-progress':
						file.progress != null && file.progress >= 0
				}"
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
			:content="message.content ?? ''"
			:users="roomUsers"
			:text-formatting="textFormatting"
			:link-options="linkOptions"
			@open-user-tag="$emit('open-user-tag', $event)"
		/>
	</div>
</template>
