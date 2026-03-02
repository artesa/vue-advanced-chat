<script setup lang="ts">
import type {
	AutoScroll,
	CustomAction,
	LinkOptions,
	Message,
	MessageAction,
	MessageFile,
	Room as RoomType,
	StringNumber,
	TemplateText,
	TextFormatting,
	UsernameOptions,
} from '@/types'

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import locales from '@/locales'
import { cssThemeVars, defaultThemeStyles } from '@/themes'

import {
	partcipantsValidation,
	roomsValidation,
} from '@/utils/data-validation'
import MediaPreview from './MediaPreview/MediaPreview.vue'
import Room from './Room/Room.vue'

import RoomsList from './RoomsList/RoomsList.vue'

const props = withDefaults(
	defineProps<{
		height?: string
		theme?: 'light' | 'dark'
		styles?: Record<string, Record<string, string>>
		responsiveBreakpoint?: number
		singleRoom?: boolean
		roomsListOpened?: boolean
		textMessages?: Record<string, StringNumber>
		currentUserId?: string
		rooms?: RoomType[]
		roomsOrder?: 'desc' | 'asc'
		loadingRooms?: boolean
		roomsLoaded?: boolean
		roomId?: string | null
		loadFirstRoom?: boolean
		messages?: Message[]
		messagesLoaded?: boolean
		roomActions?: CustomAction[]
		menuActions?: CustomAction[]
		messageActions?: MessageAction[]
		messageSelectionActions?: CustomAction[]
		autoScroll?: AutoScroll
		customSearchRoomEnabled?: boolean
		showSearch?: boolean
		showAddRoom?: boolean
		showSendIcon?: boolean
		showFiles?: boolean
		showAudio?: boolean
		audioBitRate?: number
		audioSampleRate?: number
		showEmojis?: boolean
		showReactionEmojis?: boolean
		showNewMessagesDivider?: boolean
		showFooter?: boolean
		showRoomHeader?: boolean
		textFormatting?: TextFormatting
		linkOptions?: LinkOptions
		roomInfoEnabled?: boolean
		textareaActionEnabled?: boolean
		textareaAutoFocus?: boolean
		userTagsEnabled?: boolean
		emojisSuggestionEnabled?: boolean
		roomMessage?: string
		scrollDistance?: number
		acceptedFiles?: string
		captureFiles?: string
		multipleFiles?: boolean
		templatesText?: TemplateText[]
		mediaPreviewEnabled?: boolean
		usernameOptions?: UsernameOptions
		emojiDataSource?: string
		handleCustomOpenFiles?: boolean
		showMessagesStarted?: boolean
	}>(),
	{
		height: '600px',
		theme: 'light',
		styles: () => ({}),
		responsiveBreakpoint: 900,
		singleRoom: false,
		roomsListOpened: true,
		textMessages: () => ({}),
		currentUserId: '',
		rooms: () => [],
		roomsOrder: 'desc',
		loadingRooms: false,
		roomsLoaded: false,
		roomId: null,
		loadFirstRoom: true,
		messages: () => [],
		messagesLoaded: false,
		roomActions: () => [],
		menuActions: () => [],
		messageActions: () => [
			{ name: 'replyMessage', title: 'Reply' },
			{ name: 'editMessage', title: 'Edit Message', onlyMe: true },
			{ name: 'deleteMessage', title: 'Delete Message', onlyMe: true },
			{ name: 'selectMessages', title: 'Select' },
		],
		messageSelectionActions: () => [],
		autoScroll: () => ({
			send: {
				new: true,
				newAfterScrollUp: true,
			},
			receive: {
				new: true,
				newAfterScrollUp: false,
			},
		}),
		customSearchRoomEnabled: false,
		showSearch: true,
		showAddRoom: true,
		showSendIcon: true,
		showFiles: true,
		showAudio: true,
		audioBitRate: 128,
		audioSampleRate: new (window.AudioContext || window.webkitAudioContext)().sampleRate,
		showEmojis: true,
		showReactionEmojis: true,
		showNewMessagesDivider: true,
		showFooter: true,
		showRoomHeader: true,
		textFormatting: () => ({ disabled: false }),
		linkOptions: () => ({ disabled: false, target: '_blank', rel: null }),
		roomInfoEnabled: false,
		textareaActionEnabled: false,
		textareaAutoFocus: true,
		userTagsEnabled: true,
		emojisSuggestionEnabled: true,
		roomMessage: '',
		scrollDistance: 60,
		acceptedFiles: '*',
		captureFiles: undefined,
		multipleFiles: true,
		templatesText: () => [],
		mediaPreviewEnabled: true,
		usernameOptions: () => ({ minUsers: 3, currentUser: false }),
		emojiDataSource: undefined,
		handleCustomOpenFiles: false,
		showMessagesStarted: true,
	},
)

const emit = defineEmits<{
	'toggle-rooms-list': [payload: { opened: boolean }]
	'room-info': [room: RoomType]
	'fetch-messages': [payload: { room: RoomType | Record<string, never>, options?: { reset?: boolean } }]
	'send-message': [payload: unknown]
	'edit-message': [payload: unknown]
	'delete-message': [payload: unknown]
	'open-file': [payload: unknown]
	'open-user-tag': [payload: unknown]
	'open-failed-message': [payload: unknown]
	'menu-action-handler': [payload: unknown]
	'message-action-handler': [payload: unknown]
	'send-message-reaction': [payload: unknown]
	'typing-message': [payload: unknown]
	'textarea-action-handler': [payload: unknown]
	'fetch-more-rooms': []
	'add-room': []
	'search-room': [payload: { value: string, roomId: string }]
	'room-action-handler': [payload: { action: CustomAction, roomId: string }]
	'message-selection-action-handler': [payload: unknown]
}>()

// Data
const room = ref<RoomType | Record<string, never>>({})
const loadingMoreRooms = ref(false)
const showRoomsList = ref(true)
const isMobile = ref(false)
const showMediaPreview = ref(false)
const previewFile = ref({} as MessageFile)

const t = computed(() => ({
	...locales,
	...props.textMessages,
}))

const cssVars = computed(() => {
	const defaultStyles = defaultThemeStyles[props.theme] as unknown as Record<string, Record<string, string>>
	const customStyles: Record<string, Record<string, string>> = {}

	Object.keys(defaultStyles).forEach((key) => {
		customStyles[key] = {
			...defaultStyles[key],
			...(props.styles?.[key] || {}),
		}
	})

	return cssThemeVars(customStyles as any)
})

const orderedRooms = computed(() => {
	return props.rooms!.slice().sort((a, b) => {
		const aVal = a.index || 0
		const bVal = b.index || 0

		if (props.roomsOrder === 'asc') {
			return aVal < bVal ? -1 : bVal < aVal ? 1 : 0
		}

		return aVal > bVal ? -1 : bVal > aVal ? 1 : 0
	})
})

// Watchers
watch(
	() => props.rooms,
	(newVal, oldVal) => {
		if (
			!newVal![0]
			|| !newVal!.find(r => r.roomId === (room.value as RoomType).roomId)
		) {
			showRoomsList.value = true
		}

		if (
			!loadingMoreRooms.value
			&& props.loadFirstRoom
			&& newVal![0]
			&& (!oldVal || newVal!.length !== oldVal.length)
		) {
			if (props.roomId) {
				const found = newVal!.find(r => r.roomId === props.roomId) || {}
				fetchRoom({ room: found as RoomType })
			}
			else if (!isMobile.value || props.singleRoom) {
				fetchRoom({ room: orderedRooms.value[0] })
			}
			else {
				showRoomsList.value = true
			}
		}
	},
	{ immediate: true, deep: true },
)

watch(() => props.loadingRooms, (val) => {
	if (val)
		room.value = {}
})

watch(
	() => props.roomId,
	(newVal, oldVal) => {
		if (newVal && !props.loadingRooms && props.rooms!.length) {
			const found = props.rooms!.find(r => r.roomId === newVal)
			fetchRoom({ room: found as RoomType })
		}
		else if (oldVal && !newVal) {
			room.value = {}
		}
	},
	{ immediate: true },
)

watch(room, (val) => {
	if (!val || Object.entries(val).length === 0)
		return

	roomsValidation(val as any)

	;(val as RoomType).users.forEach((user) => {
		partcipantsValidation(user as any)
	})
})

watch(
	() => props.roomsListOpened,
	(val) => {
		showRoomsList.value = !!val
	},
	{ immediate: true },
)

// Created logic
function updateResponsive() {
	isMobile.value = window.innerWidth < Number(props.responsiveBreakpoint)
}

updateResponsive()

function onResize(ev: Event) {
	if ((ev as UIEvent).isTrusted)
		updateResponsive()
}

window.addEventListener('resize', onResize)

onBeforeUnmount(() => {
	window.removeEventListener('resize', onResize)
})

// Methods
function toggleRoomsList() {
	showRoomsList.value = !showRoomsList.value
	if (isMobile.value)
		room.value = {}
	emit('toggle-rooms-list', { opened: showRoomsList.value })
}

function fetchRoom({ room: r }: { room: RoomType }) {
	room.value = r
	fetchMessages({ reset: true })
	if (isMobile.value)
		showRoomsList.value = false
}

function fetchMoreRooms() {
	emit('fetch-more-rooms')
}

function roomInfo() {
	emit('room-info', room.value as RoomType)
}

function addRoom() {
	emit('add-room')
}

function searchRoom(val: string) {
	emit('search-room', { value: val, roomId: (room.value as RoomType).roomId })
}

function fetchMessages(options?: { reset?: boolean }) {
	emit('fetch-messages', { room: room.value, options })
}

function sendMessage(message: unknown) {
	emit('send-message', { ...(message as Record<string, unknown>), roomId: (room.value as RoomType).roomId })
}

function editMessage(message: unknown) {
	emit('edit-message', { ...(message as Record<string, unknown>), roomId: (room.value as RoomType).roomId })
}

function deleteMessage(message: unknown) {
	emit('delete-message', { message, roomId: (room.value as RoomType).roomId })
}

function openFile({ message, file }: { message: Message, file: any }) {
	if (props.handleCustomOpenFiles) {
		emit('open-file', { message, file, defaultHandle: () => {
			_openFile({ message, file })
		} })
	}
	else {
		_openFile({ message, file })
	}
}

function _openFile({ message, file }: { message: Message, file: any }) {
	if (props.mediaPreviewEnabled && file.action === 'preview') {
		previewFile.value = file.file!
		showMediaPreview.value = true
	}
	else {
		emit('open-file', { message, file })
	}
}

function openUserTag(user: unknown) {
	emit('open-user-tag', user)
}

function openFailedMessage(ev: unknown) {
	const { message } = ev as { message: Message }
	emit('open-failed-message', {
		message,
		roomId: (room.value as RoomType).roomId,
	})
}

function menuActionHandler(ev: unknown) {
	const action = ev as CustomAction
	emit('menu-action-handler', {
		action,
		roomId: (room.value as RoomType).roomId,
	})
}

function roomActionHandler(ev: unknown) {
	const { action, roomId } = ev as { action: CustomAction, roomId: string }
	emit('room-action-handler', {
		action,
		roomId,
	})
}

function messageActionHandler(ev: unknown) {
	emit('message-action-handler', {
		...(ev as Record<string, unknown>),
		roomId: (room.value as RoomType).roomId,
	})
}

function messageSelectionActionHandler(ev: unknown) {
	emit('message-selection-action-handler', {
		...(ev as Record<string, unknown>),
		roomId: (room.value as RoomType).roomId,
	})
}

function sendMessageReaction(messageReaction: unknown) {
	emit('send-message-reaction', {
		...(messageReaction as Record<string, unknown>),
		roomId: (room.value as RoomType).roomId,
	})
}

function typingMessage(message: unknown) {
	emit('typing-message', {
		message,
		roomId: (room.value as RoomType).roomId,
	})
}

function textareaActionHandler(message: unknown) {
	emit('textarea-action-handler', {
		message,
		roomId: (room.value as RoomType).roomId,
	})
}
</script>

<template>
	<div class="vac-card-window" :style="[{ height }, cssVars]">
		<div class="vac-chat-container">
			<RoomsList
				v-if="!singleRoom"
				:current-user-id="currentUserId"
				:rooms="orderedRooms"
				:loading-rooms="loadingRooms!"
				:rooms-loaded="roomsLoaded!"
				:room="room"
				:room-actions="roomActions!"
				:custom-search-room-enabled="customSearchRoomEnabled!"
				:text-messages="t"
				:show-search="showSearch!"
				:show-add-room="showAddRoom!"
				:show-rooms-list="showRoomsList && roomsListOpened!"
				:text-formatting="textFormatting!"
				:link-options="linkOptions!"
				:is-mobile="isMobile"
				:scroll-distance="scrollDistance!"
				@fetch-room="fetchRoom"
				@fetch-more-rooms="fetchMoreRooms"
				@loading-more-rooms="loadingMoreRooms = $event"
				@add-room="addRoom"
				@search-room="searchRoom"
				@room-action-handler="roomActionHandler"
			>
				<template v-for="(_, name) in $slots" :key="name" #[name]="data">
					<slot :name="name" v-bind="data" />
				</template>
			</RoomsList>

			<Room
				:current-user-id="currentUserId"
				:rooms="rooms!"
				:room-id="(room as RoomType).roomId || ''"
				:load-first-room="loadFirstRoom!"
				:messages="messages!"
				:room-message="roomMessage"
				:messages-loaded="messagesLoaded!"
				:menu-actions="menuActions!"
				:message-actions="messageActions!"
				:message-selection-actions="messageSelectionActions!"
				:auto-scroll="autoScroll!"
				:show-send-icon="showSendIcon!"
				:show-files="showFiles!"
				:show-audio="showAudio!"
				:audio-bit-rate="audioBitRate"
				:audio-sample-rate="audioSampleRate"
				:show-emojis="showEmojis!"
				:show-reaction-emojis="showReactionEmojis!"
				:show-new-messages-divider="showNewMessagesDivider!"
				:show-footer="showFooter!"
				:show-room-header="showRoomHeader"
				:text-messages="t"
				:single-room="singleRoom!"
				:show-rooms-list="showRoomsList && roomsListOpened!"
				:text-formatting="textFormatting!"
				:link-options="linkOptions!"
				:is-mobile="isMobile"
				:loading-rooms="loadingRooms!"
				:room-info-enabled="roomInfoEnabled!"
				:textarea-action-enabled="textareaActionEnabled!"
				:textarea-auto-focus="textareaAutoFocus!"
				:user-tags-enabled="userTagsEnabled!"
				:emojis-suggestion-enabled="emojisSuggestionEnabled!"
				:scroll-distance="scrollDistance!"
				:accepted-files="acceptedFiles"
				:capture-files="captureFiles"
				:multiple-files="multipleFiles!"
				:templates-text="templatesText!"
				:username-options="usernameOptions!"
				:emoji-data-source="emojiDataSource"
				:show-messages-started-text="showMessagesStarted"
				@toggle-rooms-list="toggleRoomsList"
				@room-info="roomInfo"
				@fetch-messages="fetchMessages"
				@send-message="sendMessage"
				@edit-message="editMessage"
				@delete-message="deleteMessage"
				@open-file="openFile"
				@open-user-tag="openUserTag"
				@open-failed-message="openFailedMessage"
				@menu-action-handler="menuActionHandler"
				@message-action-handler="messageActionHandler"
				@message-selection-action-handler="messageSelectionActionHandler"
				@send-message-reaction="sendMessageReaction"
				@typing-message="typingMessage"
				@textarea-action-handler="textareaActionHandler"
			>
				<template v-for="(_, name) in $slots" :key="name" #[name]="data">
					<slot :name="name" v-bind="data" />
				</template>
			</Room>
		</div>
		<transition name="vac-fade-preview" appear>
			<MediaPreview
				v-if="showMediaPreview"
				:file="previewFile"
				@close-media-preview="showMediaPreview = false"
			>
				<template v-for="(_, name) in $slots" :key="name" #[name]="data">
					<slot :name="name" v-bind="data" />
				</template>
			</MediaPreview>
		</transition>
	</div>
</template>

<style lang="scss">
@use '../styles/index.scss';
</style>
