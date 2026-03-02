<script setup lang="ts">
/**
 * Custom Element wrapper for ChatWindow.
 * Accepts all props as `| string` (since CE attributes are strings),
 * casts them to their real types, and forwards to the native ChatWindow.
 */
import type {
	AutoScroll,
	CustomAction,
	DeleteMessageEvent,
	EditMessageEvent,
	FetchMessagesEvent,
	I18n,
	LinkOptions,
	MenuActionHandlerEvent,
	Message,
	MessageAction,
	MessageActionHandlerEvent,
	MessageSelectionActionHandlerEvent,
	OpenFailedMessageEvent,
	OpenFileEvent,
	OpenUserTagEvent,
	PartialDeep,
	RoomActionHandlerEvent,
	RoomInfoEvent,
	Room as RoomType,
	SearchRoomEvent,
	SendMessageEvent,
	SendMessageReactionEvent,
	StringNumber,
	TemplateText,
	TextareaActionHandlerEvent,
	TextFormatting,
	ToggleRoomsListEvent,
	TypingMessageEvent,
	UsernameOptions
} from '@/types'

import { computed } from 'vue'
import { castArray, castBoolean, castObject } from '@/utils/ce-cast'
import ChatWindow from './ChatWindow.vue'

const props = withDefaults(
	defineProps<{
		height?: string
		theme?: 'light' | 'dark'
		styles?: Record<string, Record<string, string>> | string
		responsiveBreakpoint?: number
		singleRoom?: boolean | string
		roomsListOpened?: boolean | string
		i18n?: PartialDeep<I18n> | string
		currentUserId?: string
		rooms?: RoomType[] | string
		roomsOrder?: 'desc' | 'asc'
		loadingRooms?: boolean | string
		roomsLoaded?: boolean | string
		roomId?: string | null
		loadFirstRoom?: boolean | string
		messages?: Message[] | string
		messagesLoaded?: boolean | string
		roomActions?: CustomAction[] | string
		menuActions?: CustomAction[] | string
		messageActions?: MessageAction[] | string
		messageSelectionActions?: CustomAction[] | string
		autoScroll?: AutoScroll | string
		customSearchRoomEnabled?: boolean | string
		showSearch?: boolean | string
		showAddRoom?: boolean | string
		showSendIcon?: boolean | string
		showFiles?: boolean | string
		showAudio?: boolean | string
		showEmojis?: boolean | string
		showReactionEmojis?: boolean | string
		showNewMessagesDivider?: boolean | string
		showFooter?: boolean | string
		showRoomHeader?: boolean
		textFormatting?: TextFormatting | string
		linkOptions?: LinkOptions | string
		roomInfoEnabled?: boolean | string
		textareaActionEnabled?: boolean | string
		textareaAutoFocus?: boolean | string
		userTagsEnabled?: boolean | string
		emojisSuggestionEnabled?: boolean | string
		roomMessage?: string
		scrollDistance?: number
		acceptedFiles?: string
		captureFiles?: string
		multipleFiles?: boolean | string
		templatesText?: TemplateText[] | string
		mediaPreviewEnabled?: boolean | string
		usernameOptions?: UsernameOptions | string
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
		i18n: undefined,
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
			{ name: 'selectMessages', title: 'Select' }
		],
		messageSelectionActions: () => [],
		autoScroll: () => ({
			send: {
				new: true,
				newAfterScrollUp: true
			},
			receive: {
				new: true,
				newAfterScrollUp: false
			}
		}),
		customSearchRoomEnabled: false,
		showSearch: true,
		showAddRoom: true,
		showSendIcon: true,
		showFiles: true,
		showAudio: true,
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
		showMessagesStarted: true
	}
)

const emit = defineEmits<{
	'toggle-rooms-list': [payload: ToggleRoomsListEvent]
	'room-info': [payload: RoomInfoEvent]
	'fetch-messages': [payload: FetchMessagesEvent]
	'send-message': [payload: SendMessageEvent]
	'edit-message': [payload: EditMessageEvent]
	'delete-message': [payload: DeleteMessageEvent]
	'open-file': [payload: OpenFileEvent]
	'open-user-tag': [payload: OpenUserTagEvent]
	'open-failed-message': [payload: OpenFailedMessageEvent]
	'menu-action-handler': [payload: MenuActionHandlerEvent]
	'message-action-handler': [payload: MessageActionHandlerEvent]
	'send-message-reaction': [payload: SendMessageReactionEvent]
	'typing-message': [payload: TypingMessageEvent]
	'textarea-action-handler': [payload: TextareaActionHandlerEvent]
	'fetch-more-rooms': []
	'add-room': []
	'search-room': [payload: SearchRoomEvent]
	'room-action-handler': [payload: RoomActionHandlerEvent]
	'message-selection-action-handler': [
		payload: MessageSelectionActionHandlerEvent
	]
}>()

const castedProps = computed(() => ({
	height: props.height,
	theme: props.theme,
	styles: castObject<Record<string, Record<string, string>>>(props.styles),
	responsiveBreakpoint: props.responsiveBreakpoint,
	singleRoom: castBoolean(props.singleRoom),
	roomsListOpened: castBoolean(props.roomsListOpened),
	i18n: castObject<PartialDeep<I18n>>(props.i18n),
	currentUserId: props.currentUserId,
	rooms: castArray<RoomType>(props.rooms),
	roomsOrder: props.roomsOrder,
	loadingRooms: castBoolean(props.loadingRooms),
	roomsLoaded: castBoolean(props.roomsLoaded),
	roomId: props.roomId,
	loadFirstRoom: castBoolean(props.loadFirstRoom),
	messages: castArray<Message>(props.messages),
	messagesLoaded: castBoolean(props.messagesLoaded),
	roomActions: castArray<CustomAction>(props.roomActions),
	menuActions: castArray<CustomAction>(props.menuActions),
	messageActions: castArray<MessageAction>(props.messageActions),
	messageSelectionActions: castArray<CustomAction>(
		props.messageSelectionActions
	),
	autoScroll: castObject<AutoScroll>(props.autoScroll),
	customSearchRoomEnabled: castBoolean(props.customSearchRoomEnabled),
	showSearch: castBoolean(props.showSearch),
	showAddRoom: castBoolean(props.showAddRoom),
	showSendIcon: castBoolean(props.showSendIcon),
	showFiles: castBoolean(props.showFiles),
	showAudio: castBoolean(props.showAudio),
	showEmojis: castBoolean(props.showEmojis),
	showReactionEmojis: castBoolean(props.showReactionEmojis),
	showNewMessagesDivider: castBoolean(props.showNewMessagesDivider),
	showFooter: castBoolean(props.showFooter),
	showRoomHeader: props.showRoomHeader,
	textFormatting: castObject<TextFormatting>(props.textFormatting),
	linkOptions: castObject<LinkOptions>(props.linkOptions),
	roomInfoEnabled: castBoolean(props.roomInfoEnabled),
	textareaActionEnabled: castBoolean(props.textareaActionEnabled),
	textareaAutoFocus: castBoolean(props.textareaAutoFocus),
	userTagsEnabled: castBoolean(props.userTagsEnabled),
	emojisSuggestionEnabled: castBoolean(props.emojisSuggestionEnabled),
	roomMessage: props.roomMessage,
	scrollDistance: props.scrollDistance,
	acceptedFiles: props.acceptedFiles,
	captureFiles: props.captureFiles,
	multipleFiles: castBoolean(props.multipleFiles),
	templatesText: castArray<TemplateText>(props.templatesText),
	mediaPreviewEnabled: castBoolean(props.mediaPreviewEnabled),
	usernameOptions: castObject<UsernameOptions>(props.usernameOptions),
	emojiDataSource: props.emojiDataSource,
	handleCustomOpenFiles: props.handleCustomOpenFiles,
	showMessagesStarted: props.showMessagesStarted
}))
</script>

<template>
	<ChatWindow
		v-bind="castedProps"
		@toggle-rooms-list="e => emit('toggle-rooms-list', e)"
		@room-info="e => emit('room-info', e)"
		@fetch-messages="e => emit('fetch-messages', e)"
		@send-message="e => emit('send-message', e)"
		@edit-message="e => emit('edit-message', e)"
		@delete-message="e => emit('delete-message', e)"
		@open-file="e => emit('open-file', e)"
		@open-user-tag="e => emit('open-user-tag', e)"
		@open-failed-message="e => emit('open-failed-message', e)"
		@menu-action-handler="e => emit('menu-action-handler', e)"
		@message-action-handler="e => emit('message-action-handler', e)"
		@send-message-reaction="e => emit('send-message-reaction', e)"
		@typing-message="e => emit('typing-message', e)"
		@textarea-action-handler="e => emit('textarea-action-handler', e)"
		@fetch-more-rooms="emit('fetch-more-rooms')"
		@add-room="emit('add-room')"
		@search-room="e => emit('search-room', e)"
		@room-action-handler="e => emit('room-action-handler', e)"
		@message-selection-action-handler="
			e => emit('message-selection-action-handler', e)
		"
	>
		<template v-for="(_, name) in $slots" :key="name" #[name]="data">
			<slot :name="name" v-bind="data ?? {}" />
		</template>
	</ChatWindow>
</template>
