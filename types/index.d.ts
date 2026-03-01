import type { DefineComponent } from 'vue'

export function register(): void

export type StringNumber = string | number

export interface UserStatus {
	state: 'online' | 'offline'
	lastChanged: string
}

export interface RoomUser {
	_id: string
	username: string
	avatar: string
	status: UserStatus
}

export interface MessageFile {
	name: string
	type: string
	extension: string
	url: string
	localUrl?: string
	preview?: string
	size?: number
	audio?: boolean
	duration?: number
	progress?: number
	blob?: Blob
}

export interface LastMessage {
	content: string
	senderId: string
	username?: string
	timestamp?: string
	saved?: boolean
	distributed?: boolean
	seen?: boolean
	new?: boolean
	files?: MessageFile[]
}

export interface Room {
	roomId: string
	roomName: string
	avatar: string
	users: RoomUser[]
	unreadCount?: number
	index?: StringNumber | Date
	lastMessage?: LastMessage
	typingUsers?: string[]
}

export interface MessageReactions {
	[key: string]: StringNumber[]
}

export interface Message {
	_id: string
	senderId: string
	indexId?: StringNumber
	content?: string
	username?: string
	avatar?: string
	date?: string
	timestamp?: string
	system?: boolean
	saved?: boolean
	distributed?: boolean
	seen?: boolean
	deleted?: boolean
	edited?: boolean
	failure?: boolean
	disableActions?: boolean
	disableReactions?: boolean
	files?: MessageFile[]
	reactions?: MessageReactions
	replyMessage?: Message
}

export interface CustomAction {
	name: string
	title: string
}

export interface MessageAction {
	name: string
	title: string
	onlyMe?: boolean
}

export interface TextFormatting {
	disabled?: boolean
	italic?: string
	bold?: string
	strike?: string
	underline?: string
	multilineCode?: string
	inlineCode?: string
}

export interface TemplateText {
	tag: string
	text: string
}

export interface AutoScroll {
	send?: {
		new?: boolean
		newAfterScrollUp?: boolean
	}
	receive?: {
		new?: boolean
		newAfterScrollUp?: boolean
	}
}

export interface UsernameOptions {
	minUsers?: number
	currentUser?: boolean
}

export interface LinkOptions {
	disabled?: boolean
	target?: string
	rel?: string | null
}

export interface Props {
	height?: string
	theme?: 'light' | 'dark'
	styles?: Record<string, Record<string, string>>
	responsiveBreakpoint?: number
	singleRoom?: boolean
	roomsListOpened?: boolean
	textMessages?: Record<string, StringNumber>
	currentUserId?: string
	rooms?: Room[]
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
}

export type Events = {
	'toggle-rooms-list': { opened: boolean }
	'room-info': { room: Room }
	'fetch-messages': { room: Room; options?: { reset?: boolean } }
	'send-message': { content: string; roomId: string; files?: MessageFile[]; replyMessage?: Message }
	'edit-message': { messageId: string; newContent: string; roomId: string; files?: MessageFile[] }
	'delete-message': { message: Message }
	'open-file': { message: Message; file: MessageFile }
	'open-user-tag': { user: RoomUser }
	'open-failed-message': { message: Message }
	'menu-action-handler': { action: CustomAction; roomId: string }
	'message-action-handler': { action: MessageAction; message: Message }
	'send-message-reaction': { reaction: { unicode: string; reaction: MessageReactions }; messageId: string; roomId: string }
	'typing-message': { message: string; roomId: string }
	'textarea-action-handler': { message: Message; roomId: string }
	'fetch-more-rooms': void
	'add-room': void
	'search-room': { value: string }
	'room-action-handler': { action: CustomAction; roomId: string }
	'message-selection-action-handler': { action: CustomAction; messages: Message[] }
}

export declare const VueAdvancedChat: DefineComponent<Props>
