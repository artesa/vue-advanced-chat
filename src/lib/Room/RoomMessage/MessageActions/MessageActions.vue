<script setup lang="ts">
import type { I18n, Message, MessageAction, MessageReactions } from '@/types'

import { computed, ref, useTemplateRef, watch } from 'vue'
import EmojiPickerContainer from '@/components/EmojiPickerContainer/EmojiPickerContainer.vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import { findParentBySelector } from '@/utils/element-selector'

import { vOnClickOutside } from '@vueuse/components'

const props = withDefaults(defineProps<{
	currentUserId: string | number
	message: Message
	messageActions: MessageAction[]
	showReactionEmojis: boolean
	messageHover: boolean
	hoverMessageId?: string | number | null
	hoverAudioProgress: boolean
	emojiDataSource?: string
	teleportTarget?: HTMLElement
  i18n: I18n
}>(), {
	hoverMessageId: null,
	emojiDataSource: undefined,
	teleportTarget: undefined,
})

const emit = defineEmits<{
	'update-emoji-opened': [value: boolean]
	'update-options-opened': [value: boolean]
	'update-message-hover': [value: boolean]
	'message-action-handler': [action: MessageAction]
	'send-message-reaction': [payload: { emoji: string, reaction: MessageReactions | undefined }]
}>()

const menuOptionsTop = ref(0)
const optionsOpened = ref(false)
const optionsClosing = ref(false)
const emojiOpened = ref(false)

const root = useTemplateRef<HTMLElement>('root')
const menuOptions = useTemplateRef<HTMLElement>('menuOptions')
const actionIcon = useTemplateRef<HTMLElement>('actionIcon')

const filteredMessageActions = computed(() => {
	return props.message.senderId === props.currentUserId
		? props.messageActions
		: props.messageActions.filter(message => !message.onlyMe)
})

const isMessageActions = computed(() => {
	return (
		filteredMessageActions.value.length
		&& props.messageHover
		&& !props.message.deleted
		&& !props.message.disableActions
		&& !props.hoverAudioProgress
	)
})

const isMessageReactions = computed(() => {
	return (
		props.showReactionEmojis
		&& props.messageHover
		&& !props.message.deleted
		&& !props.message.disableReactions
		&& !props.hoverAudioProgress
	)
})

watch(emojiOpened, (val) => {
	emit('update-emoji-opened', val)
	if (val)
		optionsOpened.value = false
})

watch(optionsOpened, (val) => {
	emit('update-options-opened', val)
})

function openOptions(): void {
	if (optionsClosing.value)
		return

	optionsOpened.value = !optionsOpened.value
	if (!optionsOpened.value)
		return

	setTimeout(() => {
		const roomFooterRef = findParentBySelector(root.value, '#room-footer')

		if (
			!roomFooterRef
			|| !menuOptions.value
			|| !actionIcon.value
		) {
			return
		}

		const menuOptionsTopVal
			= menuOptions.value.getBoundingClientRect().height

		const actionIconTop = actionIcon.value.getBoundingClientRect().top
		const roomFooterTop = roomFooterRef.getBoundingClientRect().top

		const optionsTopPosition
			= roomFooterTop - actionIconTop > menuOptionsTopVal + 50

		if (optionsTopPosition)
			menuOptionsTop.value = 30
		else menuOptionsTop.value = -menuOptionsTopVal
	})
}

function closeOptions(): void {
	optionsOpened.value = false
	optionsClosing.value = true
	updateMessageHover()
	setTimeout(() => (optionsClosing.value = false), 100)
}

function openEmoji(): void {
	emojiOpened.value = !emojiOpened.value
}

function closeEmoji(): void {
	emojiOpened.value = false
	updateMessageHover()
}

function updateMessageHover(): void {
	if (props.hoverMessageId !== props.message._id) {
		emit('update-message-hover', false)
	}
}

function messageActionHandler(action: MessageAction): void {
	closeOptions()
	emit('message-action-handler', action)
}

function sendMessageReaction(emoji: { unicode: string }): void {
	emit('send-message-reaction', { emoji: emoji.unicode, reaction: props.message.reactions })
	closeEmoji()
}
</script>

<template>
	<div ref="root" class="vac-message-actions-wrapper">
		<div
			class="vac-options-container"
			:style="{
				display: hoverAudioProgress ? 'none' : 'initial',
				width:
					filteredMessageActions.length && showReactionEmojis ? '70px' : '45px',
			}"
		>
			<transition-group name="vac-slide-left" tag="span">
				<div
					v-if="isMessageActions || isMessageReactions"
					key="1"
					class="vac-blur-container"
					:class="{
						'vac-options-me': message.senderId === currentUserId,
					}"
				/>

				<div
					v-if="isMessageActions"
					ref="actionIcon"
					key="2"
					class="vac-svg-button vac-message-options"
					@click="openOptions"
				>
					<slot :name="`dropdown-icon_${message._id}`">
						<SvgIcon name="dropdown" param="message" />
					</slot>
				</div>

				<div v-if="isMessageReactions" key="3">
					<slot
						name="emoji-picker"
						v-bind="{ emojiOpened }"
						:add-emoji="sendMessageReaction"
					>
						<EmojiPickerContainer
							class="vac-message-emojis"
							:emoji-opened="emojiOpened"
							:style="{ right: isMessageActions ? '30px' : '5px' }"
							:emoji-reaction="true"
              :i18n="i18n"
							:position-right="message.senderId === currentUserId"
							:message-id="message._id"
							:emoji-data-source="emojiDataSource"
							:teleport-target="teleportTarget"
							@add-emoji="sendMessageReaction"
							@open-emoji="openEmoji"
						>
							<template v-for="(idx, name) in $slots" #[name]="data">
								<slot :name="name" v-bind="data" />
							</template>
						</EmojiPickerContainer>
					</slot>
				</div>
			</transition-group>
		</div>

		<transition
			v-if="filteredMessageActions.length"
			:name="
				message.senderId === currentUserId
					? 'vac-slide-left'
					: 'vac-slide-right'
			"
		>
			<div
				v-if="optionsOpened"
				ref="menuOptions"
				v-on-click-outside="closeOptions"
				class="vac-menu-options"
				:class="{
					'vac-menu-left': message.senderId !== currentUserId,
				}"
				:style="{ top: `${menuOptionsTop}px` }"
			>
				<div class="vac-menu-list">
					<div v-for="action in filteredMessageActions" :key="action.name">
						<div class="vac-menu-item" @click="messageActionHandler(action)">
							{{ action.title }}
						</div>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>
