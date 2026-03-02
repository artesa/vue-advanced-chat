<script setup lang="ts">
import type {
	AutoScroll,
	CustomAction,
	LinkOptions,
	Message,
	MessageAction,
	Room,
	StringNumber,
	TemplateText,
	TextFormatting,
	TextMessages,
	UsernameOptions,
} from '@/types'

import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import Loader from '@/components/Loader/Loader.vue'

import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'

import RoomFooter from './RoomFooter/RoomFooter.vue'
import RoomHeader from './RoomHeader/RoomHeader.vue'
import RoomMessage from './RoomMessage/RoomMessage.vue'

const props = withDefaults(defineProps<{
	currentUserId: StringNumber
	textMessages: TextMessages
	singleRoom: boolean
	showRoomsList: boolean
	isMobile: boolean
	rooms: Room[]
	roomId: StringNumber
	loadFirstRoom: boolean
	messages: Message[]
	roomMessage: string | null
	messagesLoaded: boolean
	menuActions: CustomAction[]
	messageActions: MessageAction[]
	messageSelectionActions: CustomAction[]
	autoScroll: AutoScroll
	showSendIcon: boolean
	showFiles: boolean
	showAudio: boolean
	showRoomHeader: boolean
	showEmojis: boolean
	showReactionEmojis: boolean
	showNewMessagesDivider: boolean
	showFooter: boolean
	acceptedFiles: string
	captureFiles?: string
	multipleFiles: boolean
	textFormatting: TextFormatting
	linkOptions: LinkOptions
	loadingRooms: boolean
	roomInfoEnabled: boolean
	textareaActionEnabled: boolean
	textareaAutoFocus: boolean
	userTagsEnabled: boolean
	emojisSuggestionEnabled: boolean
	scrollDistance: number
	templatesText: TemplateText[] | null
	usernameOptions: UsernameOptions
	emojiDataSource: string | undefined
	showMessagesStartedText: boolean
}>(), {
	roomMessage: null,
	showRoomHeader: true,
	multipleFiles: true,
	templatesText: null,
	emojiDataSource: undefined,
	showMessagesStartedText: true,
})

const emit = defineEmits<{
	'toggle-rooms-list': []
	'room-info': []
	'menu-action-handler': [value: unknown]
	'message-selection-action-handler': [value: { action: CustomAction, messages: Message[] }]
	'edit-message': [value: unknown]
	'send-message': [value: unknown]
	'delete-message': [value: Message]
	'message-action-handler': [value: { action: MessageAction, message: Message }]
	'fetch-messages': []
	'send-message-reaction': [value: unknown]
	'typing-message': [value: unknown]
	'open-file': [value: { message: Message, file: unknown }]
	'open-user-tag': [value: unknown]
	'open-failed-message': [value: unknown]
	'textarea-action-handler': [value: unknown]
}>()

const root = useTemplateRef<HTMLElement>('root')
const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer')

const editedMessageId = ref<StringNumber | null>(null)
const initReplyMessage = ref<Message | null>(null)
const initEditMessage = ref<Message | null>(null)
const loadingMessages = ref(false)
const observer = ref<IntersectionObserver | null>(null)
const showLoader = ref(true)
const loadingMoreMessages = ref(false)
const scrollIcon = ref(false)
const scrollMessagesCount = ref(0)
const newMessages = ref<Array<{ _id: string, index: number }>>([])
const messageSelectionEnabled = ref(false)
const selectedMessages = ref<Message[]>([])
const droppedFiles = ref<File[]>([])

const room = computed<Room | Record<string, never>>(() => {
	return props.rooms.find(r => r.roomId === props.roomId) || {}
})

const showNoMessages = computed(() => {
	return (
		props.roomId
		&& !props.messages.length
		&& !loadingMessages.value
		&& !props.loadingRooms
	)
})

const showNoRoom = computed(() => {
	const noRoomSelected
		= (!props.rooms.length && !props.loadingRooms)
			|| (!props.roomId && !props.loadFirstRoom)

	if (noRoomSelected) {
		updateLoadingMessages(false)
	}
	return noRoomSelected
})

const showMessagesStarted = computed(() => {
	return props.messages.length && props.messagesLoaded && props.showMessagesStartedText
})

watch(() => props.roomId, () => {
	onRoomChanged()
}, { immediate: true })

watch(() => props.messages, (newVal, oldVal) => {
	newVal.forEach((message, i) => {
		if (
			props.showNewMessagesDivider
			&& !message.seen
			&& message.senderId !== props.currentUserId
		) {
			newMessages.value.push({
				_id: message._id,
				index: i,
			})
		}
	})
	if (oldVal?.length === newVal?.length - 1) {
		newMessages.value = []
	}
	setTimeout(() => (loadingMoreMessages.value = false))
}, { deep: true })

watch(() => props.messagesLoaded, (val) => {
	if (val)
		updateLoadingMessages(false)
})

onMounted(() => {
	newMessages.value = []
})

function updateLoadingMessages(val: boolean) {
	loadingMessages.value = val

	if (!val) {
		setTimeout(() => initIntersectionObserver())
	}
}

function initIntersectionObserver() {
	if (observer.value) {
		showLoader.value = true
		observer.value.disconnect()
	}

	const loader = root.value?.querySelector('#infinite-loader-messages')

	if (loader) {
		const options = {
			root: root.value?.querySelector('#messages-list'),
			rootMargin: `${props.scrollDistance}px`,
			threshold: 0,
		}

		observer.value = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				loadMoreMessages()
			}
		}, options)

		observer.value.observe(loader)
	}
}

function preventTopScroll() {
	const container = scrollContainer.value
	if (!container)
		return
	const prevScrollHeight = container.scrollHeight

	const resizeObserver = new ResizeObserver((_) => {
		if (container.scrollHeight !== prevScrollHeight) {
			if (scrollContainer.value) {
				scrollContainer.value.scrollTo({
					top: container.scrollHeight - prevScrollHeight,
				})
				resizeObserver.disconnect()
			}
		}
	})

	for (let i = 0; i < container.children.length; i++) {
		resizeObserver.observe(container.children[i])
	}
}

function touchStart(touchEvent: TouchEvent) {
	if (props.singleRoom)
		return

	if (touchEvent.changedTouches.length === 1) {
		const posXStart = touchEvent.changedTouches[0].clientX
		const posYStart = touchEvent.changedTouches[0].clientY

		addEventListener(
			'touchend',
			ev => touchEnd(ev as TouchEvent, posXStart, posYStart),
			{ once: true },
		)
	}
}

function touchEnd(touchEvent: TouchEvent, posXStart: number, posYStart: number) {
	if (touchEvent.changedTouches.length === 1) {
		const posXEnd = touchEvent.changedTouches[0].clientX
		const posYEnd = touchEvent.changedTouches[0].clientY

		const swippedRight = posXEnd - posXStart > 100
		const swippedVertically = Math.abs(posYEnd - posYStart) > 50

		if (swippedRight && !swippedVertically) {
			emit('toggle-rooms-list')
		}
	}
}

function onRoomChanged() {
	updateLoadingMessages(true)
	scrollIcon.value = false
	scrollMessagesCount.value = 0
	resetMessageSelection()

	const unwatch = watch(
		() => props.messages,
		(val) => {
			if (!val || !val.length)
				return

			const element = scrollContainer.value
			if (!element)
				return

			unwatch()

			setTimeout(() => {
				element.scrollTo({ top: element.scrollHeight })
				updateLoadingMessages(false)
			})
		},
	)
}

function resetMessageSelection() {
	messageSelectionEnabled.value = false
	selectedMessages.value = []
}

function selectMessage(message: Message) {
	selectedMessages.value.push(message)
}

function unselectMessage(messageId: string) {
	selectedMessages.value = selectedMessages.value.filter(
		message => message._id !== messageId,
	)
}

function onMessageAdded({ message, index, ref: messageRef }: { message: Message, index: number, ref: HTMLElement | undefined }) {
	if (index !== props.messages.length - 1 || !messageRef)
		return

	const autoScrollOffset = messageRef.offsetHeight + 60

	setTimeout(() => {
		const container = scrollContainer.value
		let scrolledUp = false

		if (container) {
			scrolledUp = getBottomScroll(container) > autoScrollOffset
		}

		if (message.senderId === props.currentUserId) {
			if (scrolledUp) {
				if (props.autoScroll.send?.newAfterScrollUp) {
					scrollToBottom()
				}
			}
			else {
				if (props.autoScroll.send?.new) {
					scrollToBottom()
				}
			}
		}
		else {
			if (scrolledUp) {
				if (props.autoScroll.receive?.newAfterScrollUp) {
					scrollToBottom()
				}
				else {
					scrollIcon.value = true
					scrollMessagesCount.value++
				}
			}
			else {
				if (props.autoScroll.receive?.new) {
					scrollToBottom()
				}
				else {
					scrollIcon.value = true
					scrollMessagesCount.value++
				}
			}
		}
	})
}

function onContainerScroll(e: Event) {
	if (!e.target)
		return

	const bottomScroll = getBottomScroll(e.target as HTMLElement)
	if (bottomScroll < 60)
		scrollMessagesCount.value = 0
	scrollIcon.value = bottomScroll > 500 || !!scrollMessagesCount.value
}

function loadMoreMessages() {
	if (loadingMessages.value)
		return

	setTimeout(
		() => {
			if (loadingMoreMessages.value)
				return

			if (props.messagesLoaded || !props.roomId) {
				loadingMoreMessages.value = false
				showLoader.value = false
				return
			}

			preventTopScroll()
			emit('fetch-messages')
			loadingMoreMessages.value = true
		},
		// prevent scroll bouncing speed
		500,
	)
}

function messageActionHandler({ action, message }: { action: MessageAction, message: Message }) {
	switch (action.name) {
		case 'replyMessage':
			initReplyMessage.value = message
			setTimeout(() => {
				initReplyMessage.value = null
			})
			return
		case 'editMessage':
			initEditMessage.value = message
			setTimeout(() => {
				initEditMessage.value = null
			})
			return
		case 'deleteMessage':
			return emit('delete-message', message)
		case 'selectMessages':
			selectedMessages.value = [message]
			messageSelectionEnabled.value = true
			return
		default:
			return emit('message-action-handler', { action, message })
	}
}

function messageSelectionActionHandler(action: CustomAction) {
	emit('message-selection-action-handler', {
		action,
		messages: selectedMessages.value,
	})
	resetMessageSelection()
}

function sendMessageReaction(messageReaction: unknown) {
	emit('send-message-reaction', messageReaction)
}

function getBottomScroll(element: HTMLElement) {
	const { scrollHeight, clientHeight, scrollTop } = element
	return scrollHeight - clientHeight - scrollTop
}

function scrollToBottom() {
	setTimeout(() => {
		const element = scrollContainer.value
		if (element) {
			element.classList.add('vac-scroll-smooth')
			element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
			setTimeout(() => element.classList.remove('vac-scroll-smooth'))
		}
	}, 50)
}

function openFile({ message, file }: { message: Message, file: unknown }) {
	emit('open-file', { message, file })
}

function openUserTag(user: unknown) {
	emit('open-user-tag', user)
}

function onDropFiles(event: DragEvent) {
	if (props.showFiles) {
		droppedFiles.value = Array.from(event.dataTransfer?.files || [])
	}
}
</script>

<template>
	<div
		v-show="(isMobile && !showRoomsList) || !isMobile || singleRoom"
		ref="root"
		class="vac-col-messages"
		@drop.prevent="onDropFiles"
		@dragenter.prevent
		@dragover.prevent
		@dragleave.prevent
		@touchstart="touchStart"
	>
		<slot v-if="showNoRoom" name="no-room-selected">
			<div class="vac-container-center vac-room-empty">
				<div>{{ textMessages.ROOM_EMPTY }}</div>
			</div>
		</slot>

		<RoomHeader
			v-else-if="showRoomHeader"
			:current-user-id="currentUserId"
			:text-messages="textMessages"
			:single-room="singleRoom"
			:show-rooms-list="showRoomsList"
			:is-mobile="isMobile"
			:room-info-enabled="roomInfoEnabled"
			:menu-actions="menuActions"
			:room="(room as any)"
			:message-selection-enabled="messageSelectionEnabled"
			:message-selection-actions="messageSelectionActions"
			:selected-messages-total="selectedMessages.length"
			@toggle-rooms-list="emit('toggle-rooms-list')"
			@room-info="emit('room-info')"
			@menu-action-handler="emit('menu-action-handler', $event)"
			@message-selection-action-handler="messageSelectionActionHandler"
			@cancel-message-selection="messageSelectionEnabled = false"
		>
			<template v-for="(i, name) in $slots" #[name]="data">
				<slot :name="name" v-bind="data" />
			</template>
		</RoomHeader>

		<div
			id="messages-list"
			ref="scrollContainer"
			class="vac-container-scroll"
			:class="{ 'vac-no-room-header': !showRoomHeader }"
			@scroll="onContainerScroll"
		>
			<Loader :show="loadingMessages" type="messages">
				<template v-for="(idx, name) in $slots" #[name]="data">
					<slot :name="name" v-bind="data" />
				</template>
			</Loader>
			<div class="vac-messages-container">
				<div :class="{ 'vac-messages-hidden': loadingMessages }">
					<transition name="vac-fade-message">
						<div>
							<div v-if="showNoMessages" class="vac-text-started">
								<slot name="messages-empty">
									{{ textMessages.MESSAGES_EMPTY }}
								</slot>
							</div>
							<div v-if="showMessagesStarted" class="vac-text-started">
								{{ textMessages.CONVERSATION_STARTED }} {{ messages[0].date }}
							</div>
						</div>
					</transition>
					<div
						v-if="messages.length && !messagesLoaded"
						id="infinite-loader-messages"
					>
						<Loader :show="true" :infinite="true" type="infinite-messages">
							<template v-for="(idx, name) in $slots" #[name]="data">
								<slot :name="name" v-bind="data" />
							</template>
						</Loader>
					</div>
					<transition-group :key="roomId" name="vac-fade-message" tag="span">
						<div v-for="(m, i) in messages" :key="m.indexId || m._id">
							<RoomMessage
								:current-user-id="currentUserId"
								:message="m"
								:index="i"
								:messages="messages"
								:edited-message-id="editedMessageId"
								:message-actions="messageActions"
								:room-users="(room as any).users"
								:text-messages="textMessages"
								:new-messages="newMessages"
								:show-reaction-emojis="showReactionEmojis"
								:show-new-messages-divider="showNewMessagesDivider"
								:text-formatting="textFormatting"
								:link-options="linkOptions"
								:username-options="usernameOptions"
								:message-selection-enabled="messageSelectionEnabled"
								:selected-messages="selectedMessages"
								:emoji-data-source="emojiDataSource"
								@message-added="onMessageAdded"
								@message-action-handler="messageActionHandler"
								@open-file="openFile"
								@open-user-tag="openUserTag"
								@open-failed-message="emit('open-failed-message', $event)"
								@send-message-reaction="sendMessageReaction"
								@select-message="selectMessage"
								@unselect-message="unselectMessage"
							>
								<template v-for="(idx, name) in $slots" #[name]="data">
									<slot :name="name" v-bind="data" />
								</template>
							</RoomMessage>
						</div>
					</transition-group>
				</div>
			</div>
		</div>
		<div v-if="!loadingMessages">
			<transition name="vac-bounce">
				<div v-if="scrollIcon" class="vac-icon-scroll" @click="scrollToBottom">
					<transition name="vac-bounce">
						<div
							v-if="scrollMessagesCount"
							class="vac-badge-counter vac-messages-count"
						>
							{{ scrollMessagesCount }}
						</div>
					</transition>
					<slot name="scroll-icon">
						<SvgIcon name="dropdown" param="scroll" />
					</slot>
				</div>
			</transition>
		</div>

		<RoomFooter
			:room="(room as any)"
			:room-id="roomId"
			:room-message="roomMessage"
			:text-messages="textMessages"
			:show-send-icon="showSendIcon"
			:show-files="showFiles"
			:show-audio="showAudio"
			:show-emojis="showEmojis"
			:show-footer="showFooter"
			:accepted-files="acceptedFiles"
			:capture-files="captureFiles"
			:multiple-files="multipleFiles"
			:textarea-action-enabled="textareaActionEnabled"
			:textarea-auto-focus="textareaAutoFocus"
			:user-tags-enabled="userTagsEnabled"
			:emojis-suggestion-enabled="emojisSuggestionEnabled"
			:templates-text="templatesText"
			:text-formatting="textFormatting"
			:link-options="linkOptions"
			:init-reply-message="initReplyMessage"
			:init-edit-message="initEditMessage"
			:dropped-files="droppedFiles"
			:emoji-data-source="emojiDataSource"
			@update-edited-message-id="editedMessageId = $event ?? null"
			@edit-message="emit('edit-message', $event)"
			@send-message="emit('send-message', $event)"
			@typing-message="emit('typing-message', $event)"
			@textarea-action-handler="emit('textarea-action-handler', $event)"
		>
			<template v-for="(idx, name) in $slots" #[name]="data">
				<slot :name="name" v-bind="data" />
			</template>
		</RoomFooter>
	</div>
</template>
