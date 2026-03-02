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
	_id?: string
	content: string
	senderId: string
	username?: string
	timestamp?: string
	saved?: boolean
	distributed?: boolean
	seen?: boolean
	new?: boolean
	deleted?: boolean
	files?: MessageFile[]
}

export interface Room {
	roomId: StringNumber
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

export interface TextMessages {
	ROOMS_EMPTY: string
	ROOM_EMPTY: string
	NEW_MESSAGES: string
	MESSAGE_DELETED: string
	MESSAGES_EMPTY: string
	CONVERSATION_STARTED: string
	TYPE_MESSAGE: string
	SEARCH: string
	IS_ONLINE: string
	LAST_SEEN: string
	IS_TYPING: string
	CANCEL_SELECT_MESSAGE: string
	[key: string]: StringNumber
}

export interface ThemeStyles {
	general: Record<string, string>
	container: Record<string, string>
	header: Record<string, string>
	footer: Record<string, string>
	content: Record<string, string>
	sidemenu: Record<string, string>
	dropdown: Record<string, string>
	message: Record<string, string>
	markdown: Record<string, string>
	room: Record<string, string>
	emoji: Record<string, string>
	icons: Record<string, string>
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

export interface Events {
	'toggle-rooms-list': { opened: boolean }
	'room-info': Room
	'fetch-messages': { room: Room, options?: { reset?: boolean } }
	'send-message': { content: string, roomId: StringNumber, files?: MessageFile[], replyMessage?: Message, usersTag?: string[] }
	'edit-message': { messageId: StringNumber, newContent: string, roomId: StringNumber, files?: MessageFile[], replyMessage?: Message, usersTag?: string[] }
	'delete-message': { message: unknown, roomId: StringNumber }
	'open-file': { message: Message, file: MessageFile, defaultHandle?: () => void }
	'open-user-tag': unknown
	'open-failed-message': { message: Message, roomId: StringNumber }
	'menu-action-handler': { action: CustomAction, roomId: StringNumber }
	'message-action-handler': { action: MessageAction, message: Message, roomId: StringNumber }
	'send-message-reaction': { messageId: StringNumber, reaction: string, remove: boolean, roomId: StringNumber }
	'typing-message': { message: unknown, roomId: StringNumber }
	'textarea-action-handler': { message: unknown, roomId: StringNumber }
	'fetch-more-rooms': void
	'add-room': void
	'search-room': { value: string, roomId: StringNumber }
	'room-action-handler': { action: CustomAction, roomId: StringNumber }
	'message-selection-action-handler': { action: CustomAction, messages: Message[], roomId: StringNumber }
}
