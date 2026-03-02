<script setup lang="ts">
import type {
	LinkOptions,
	Message,
	MessageAction,
	MessageFileAction,
	MessageReactions as MessageReactionsType,
	RoomOpenFileEvent,
	RoomUser,
	StringNumber,
	TextFormatting,
	TextMessages,
	UsernameOptions
} from '@/types'

import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import FormatMessage from '@/components/FormatMessage/FormatMessage.vue'

import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import { messagesValidation } from '@/utils/data-validation'
import { isAudioFile } from '@/utils/media-file'
import AudioPlayer from './AudioPlayer/AudioPlayer.vue'
import MessageActions from './MessageActions/MessageActions.vue'

import MessageFiles from './MessageFiles/MessageFiles.vue'
import MessageReactions from './MessageReactions/MessageReactions.vue'

import MessageReply from './MessageReply/MessageReply.vue'

const props = withDefaults(
	defineProps<{
		currentUserId: StringNumber
		textMessages: TextMessages
		index: number
		message: Message
		messages: Message[]
		editedMessageId?: StringNumber | null
		roomUsers?: RoomUser[]
		messageActions: MessageAction[]
		newMessages?: Array<{ _id: string; index: number }>
		showReactionEmojis: boolean
		showNewMessagesDivider: boolean
		textFormatting: TextFormatting
		linkOptions: LinkOptions
		usernameOptions: UsernameOptions
		messageSelectionEnabled: boolean
		selectedMessages?: Message[]
		emojiDataSource?: string
	}>(),
	{
		editedMessageId: null,
		roomUsers: () => [],
		newMessages: () => [],
		selectedMessages: () => [],
		emojiDataSource: undefined
	}
)

const emit = defineEmits<{
	(
		e: 'message-added',
		payload: { message: Message; index: number; ref: HTMLElement | undefined }
	): void
	(e: 'open-file', payload: RoomOpenFileEvent): void
	(e: 'open-user-tag', user: RoomUser | undefined): void
	(e: 'open-failed-message', payload: { message: Message }): void
	(
		e: 'message-action-handler',
		payload: { action: MessageAction; message: Message }
	): void
	(
		e: 'send-message-reaction',
		payload: { messageId: string; reaction: string; remove: boolean }
	): void
	(e: 'select-message', payload: Message): void
	(e: 'unselect-message', payload: string): void
}>()

const messageRef = useTemplateRef<HTMLElement>('message')
const emojiTarget = useTemplateRef<HTMLElement>('emojiTarget')

// Data
const hoverMessageId = ref<string | null>(null)
const messageHover = ref(false)
const optionsOpened = ref(false)
const emojiOpened = ref(false)
const newMessage = ref<Record<string, unknown>>({})
const progressTime = ref('- : -')
const hoverAudioProgress = ref(false)

// Computed
const showUsername = computed(() => {
	if (
		!props.usernameOptions.currentUser &&
		props.message.senderId === props.currentUserId
	) {
		return false
	} else {
		return (
			(props.roomUsers.length ?? 0) >= (props.usernameOptions.minUsers ?? 0)
		)
	}
})

const showDate = computed(() => {
	return (
		props.index > 0 &&
		props.message.date !== props.messages[props.index - 1].date
	)
})

const messageOffset = computed(() => {
	return (
		props.index > 0 &&
		props.message.senderId !== props.messages[props.index - 1].senderId
	)
})

const isMessageHover = computed(() => {
	return (
		props.editedMessageId === props.message._id ||
		hoverMessageId.value === props.message._id
	)
})

const isAudio = computed(() => {
	return props.message.files?.some(file => isAudioFile(file))
})

const isCheckmarkVisible = computed(() => {
	return (
		props.message.senderId === props.currentUserId &&
		!props.message.deleted &&
		(props.message.saved || props.message.distributed || props.message.seen)
	)
})

const hasCurrentUserAvatar = computed(() => {
	return props.messages.some(
		message => message.senderId === props.currentUserId && message.avatar
	)
})

const hasSenderUserAvatar = computed(() => {
	return props.messages.some(
		message => message.senderId !== props.currentUserId && message.avatar
	)
})

const isMessageSelected = computed(() => {
	return (
		props.messageSelectionEnabled &&
		!!props.selectedMessages.find(message => message._id === props.message._id)
	)
})

// Watchers
watch(
	() => props.newMessages,
	val => {
		if (!val.length || !props.showNewMessagesDivider) {
			newMessage.value = {}
			return
		}

		newMessage.value = val.reduce((res, obj) =>
			obj.index < res.index ? obj : res
		)
	},
	{ immediate: true, deep: true }
)

watch(
	() => props.messageSelectionEnabled,
	() => {
		resetMessageHover()
	}
)

// Lifecycle
onMounted(() => {
	messagesValidation(props.message)

	emit('message-added', {
		message: props.message,
		index: props.index,
		ref: messageRef.value ?? undefined
	})
})

// Methods
function onHoverMessage() {
	if (!props.messageSelectionEnabled) {
		messageHover.value = true
		if (canEditMessage()) hoverMessageId.value = props.message._id
	}
}

function canEditMessage() {
	return !props.message.deleted
}

function onLeaveMessage() {
	if (!props.messageSelectionEnabled) {
		if (!optionsOpened.value && !emojiOpened.value) messageHover.value = false
		hoverMessageId.value = null
	}
}

function resetMessageHover() {
	messageHover.value = false
	hoverMessageId.value = null
}

function openFile(event: MessageFileAction) {
	emit('open-file', { message: props.message, ...event })
}

function openUserTag(user: RoomUser | undefined) {
	emit('open-user-tag', user)
}

function messageActionHandler(action: MessageAction) {
	resetMessageHover()

	setTimeout(() => {
		emit('message-action-handler', { action, message: props.message })
	}, 300)
}

function sendMessageReaction(payload: {
	emoji: string | { unicode: string }
	reaction?: StringNumber[] | MessageReactionsType
}) {
	const emoji = payload.emoji
	const reaction = payload.reaction
	emit('send-message-reaction', {
		messageId: props.message._id,
		reaction: typeof emoji === 'string' ? emoji : emoji.unicode,
		remove:
			!!reaction &&
			Array.isArray(reaction) &&
			reaction.includes(props.currentUserId)
	})
	messageHover.value = false
}

function selectMessage() {
	if (props.messageSelectionEnabled) {
		if (isMessageSelected.value) {
			emit('unselect-message', props.message._id)
		} else {
			emit('select-message', props.message)
		}
	}
}
</script>

<template>
	<div :id="message._id" ref="message" class="vac-message-wrapper">
		<div v-if="showDate" class="vac-card-info vac-card-date">
			{{ message.date }}
		</div>

		<div v-if="newMessage._id === message._id" class="vac-line-new">
			{{ textMessages.NEW_MESSAGES }}
		</div>

		<div v-if="message.system" class="vac-card-info vac-card-system">
			<slot :name="`message_${message._id}`">
				<FormatMessage
					:message-id="message._id"
					:content="message.content ?? ''"
					:deleted="!!message.deleted"
					:users="roomUsers"
					:text-messages="textMessages"
					:text-formatting="textFormatting"
					:link-options="linkOptions"
					@open-user-tag="openUserTag"
				>
					<template v-for="(idx, name) in $slots" #[name]="data">
						<slot :name="name" v-bind="data" />
					</template>
				</FormatMessage>
			</slot>
		</div>

		<div
			v-else
			class="vac-message-box"
			:class="{ 'vac-offset-current': message.senderId === currentUserId }"
			@click="selectMessage"
		>
			<slot :name="`message_${message._id}`">
				<slot
					v-if="message.senderId !== currentUserId"
					:name="`message-avatar_${message._id}`"
				>
					<div
						v-if="message.avatar"
						class="vac-avatar"
						:style="{ 'background-image': `url('${message.avatar}')` }"
					/>
				</slot>
				<div
					v-if="hasSenderUserAvatar && !message.avatar"
					class="vac-avatar-offset"
				/>
				<div
					class="vac-message-container"
					:class="{
						'vac-message-container-offset': messageOffset
					}"
				>
					<div
						class="vac-message-card"
						:class="{
							'vac-message-highlight': isMessageHover,
							'vac-message-current': message.senderId === currentUserId,
							'vac-message-deleted': message.deleted,
							'vac-item-clickable': messageSelectionEnabled,
							'vac-message-selected': isMessageSelected
						}"
						@mouseover="onHoverMessage"
						@mouseleave="onLeaveMessage"
					>
						<div
							ref="emojiTarget"
							class="vac-emoji-wrapper vac-emoji-teleported"
						/>

						<div
							v-if="showUsername"
							class="vac-text-username"
							:class="{
								'vac-username-reply': !message.deleted && message.replyMessage
							}"
						>
							<span>{{ message.username }}</span>
						</div>

						<MessageReply
							v-if="!message.deleted && message.replyMessage"
							:message="message"
							:room-users="roomUsers"
							:text-formatting="textFormatting"
							:link-options="linkOptions"
						>
							<template v-for="(i, name) in $slots" #[name]="data">
								<slot :name="name" v-bind="data" />
							</template>
						</MessageReply>

						<FormatMessage
							v-if="
								!!message.deleted || !message.files || !message.files.length
							"
							:message-id="message._id"
							:content="message.content ?? ''"
							:deleted="!!message.deleted"
							:users="roomUsers"
							:text-formatting="textFormatting"
							:text-messages="textMessages"
							:link-options="linkOptions"
							@open-user-tag="openUserTag"
						>
							<template v-for="(idx, name) in $slots" #[name]="data">
								<slot :name="name" v-bind="data" />
							</template>
						</FormatMessage>

						<MessageFiles
							v-else-if="!isAudio || message.files.length > 1"
							:current-user-id="currentUserId"
							:message="message"
							:room-users="roomUsers"
							:text-formatting="textFormatting"
							:link-options="linkOptions"
							:message-selection-enabled="messageSelectionEnabled"
							@open-file="openFile"
							@open-user-tag="openUserTag"
						>
							<template v-for="(i, name) in $slots" #[name]="data">
								<slot :name="name" v-bind="data" />
							</template>
						</MessageFiles>

						<template v-else>
							<AudioPlayer
								:message-id="message._id"
								:src="message.files[0].url"
								:message-selection-enabled="messageSelectionEnabled"
								@update-progress-time="progressTime = $event as string"
								@hover-audio-progress="hoverAudioProgress = $event as boolean"
							>
								<template v-for="(i, name) in $slots" #[name]="data">
									<slot :name="name" v-bind="data" />
								</template>
							</AudioPlayer>

							<div v-if="!message.deleted" class="vac-progress-time">
								{{ progressTime }}
							</div>
						</template>

						<div class="vac-text-timestamp">
							<div
								v-if="message.edited && !message.deleted"
								class="vac-icon-edited"
							>
								<slot :name="`pencil-icon_${message._id}`">
									<SvgIcon name="pencil" />
								</slot>
							</div>
							<span>{{ message.timestamp }}</span>
							<span v-if="isCheckmarkVisible">
								<slot :name="`checkmark-icon_${message._id}`">
									<SvgIcon
										:name="
											message.distributed ? 'double-checkmark' : 'checkmark'
										"
										:param="message.seen ? 'seen' : ''"
										class="vac-icon-check"
									/>
								</slot>
							</span>
						</div>

						<MessageActions
							:current-user-id="currentUserId"
							:message="message"
							:message-actions="messageActions"
							:show-reaction-emojis="showReactionEmojis"
							:message-hover="messageHover"
							:hover-message-id="hoverMessageId"
							:hover-audio-progress="hoverAudioProgress"
							:emoji-data-source="emojiDataSource"
							:teleport-target="emojiTarget ?? undefined"
							@update-message-hover="messageHover = $event"
							@update-options-opened="optionsOpened = $event"
							@update-emoji-opened="emojiOpened = $event"
							@message-action-handler="messageActionHandler"
							@send-message-reaction="sendMessageReaction"
						>
							<template v-for="(i, name) in $slots" #[name]="data">
								<slot :name="name" v-bind="data" />
							</template>
						</MessageActions>
					</div>

					<MessageReactions
						:current-user-id="currentUserId"
						:message="message"
						@send-message-reaction="sendMessageReaction"
					/>
				</div>
				<slot :name="`message-failure_${message._id}`">
					<div
						v-if="message.failure && message.senderId === currentUserId"
						class="vac-failure-container vac-svg-button"
						:class="{
							'vac-failure-container-avatar':
								message.avatar && message.senderId === currentUserId
						}"
						@click="$emit('open-failed-message', { message })"
					>
						<div class="vac-failure-text">!</div>
					</div>
				</slot>
				<slot
					v-if="message.senderId === currentUserId"
					:name="`message-avatar_${message._id}`"
				>
					<div
						v-if="message.avatar"
						class="vac-avatar vac-avatar-current"
						:style="{ 'background-image': `url('${message.avatar}')` }"
					/>
				</slot>
				<div
					v-if="hasCurrentUserAvatar && !message.avatar"
					class="vac-avatar-current-offset"
				/>
			</slot>
		</div>
	</div>
</template>
