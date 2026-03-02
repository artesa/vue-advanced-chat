<script setup lang="ts">
import type {
	CustomAction,
	DeleteMessageEvent,
	EditMessageEvent,
	FetchMessagesEvent,
	MenuActionHandlerEvent,
	Message,
	MessageFile,
	MessageSelectionActionHandlerEvent,
	OpenFileEvent,
	Room,
	RoomUser,
	SendMessageEvent,
	SendMessageReactionEvent,
	StringNumber,
	TemplateText,
} from '@artesa/vue-advanced-chat'
import type { SeedMessage, SeedRoom } from '@/data/mock-data'
import { VueAdvancedChat } from '@artesa/vue-advanced-chat'
import { computed, onMounted, ref } from 'vue'
import logoAvatar from '@/assets/logo.png'
import {
	messagesByRoom as seedMessages,
	rooms as seedRooms,
	users as seedUsers,
} from '@/data/mock-data'
import '@artesa/vue-advanced-chat/style.css'

const props = defineProps<{
	currentUserId: string
	theme: 'light' | 'dark'
	isDevice: boolean
}>()

const emit = defineEmits<{
	showDemoOptions: [opened: boolean]
}>()

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
})

function formatTime(date: Date): string {
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// In-memory stores
const allUsers = ref<RoomUser[]>(JSON.parse(JSON.stringify(seedUsers)))
const allRooms = ref<SeedRoom[]>(JSON.parse(JSON.stringify(seedRooms)))
const allMessages = ref<Record<string, SeedMessage[]>>(JSON.parse(JSON.stringify(seedMessages)))
let nextMessageId = 100
let nextRoomId = 10

// Component state
const rooms = ref<Room[]>([])
const roomId = ref<StringNumber>('')
const roomsLoaded = ref(false)
const loadingRooms = ref(true)
const messages = ref<Message[]>([])
const messagesLoaded = ref(false)
const roomMessage = ref('')
const selectedRoom = ref<Room | null>(null)
const disableForm = ref(false)
const addNewRoom = ref(false)
const addRoomUsername = ref('')
const inviteRoomId = ref<StringNumber | null>(null)
const invitedUsername = ref('')
const removeRoomId = ref<StringNumber | null>(null)
const removeUserId = ref('')
const removeUsers = ref<RoomUser[]>([])

// Config
const roomActions: CustomAction[] = [
	{ name: 'inviteUser', title: 'Invite User' },
	{ name: 'removeUser', title: 'Remove User' },
	{ name: 'deleteRoom', title: 'Delete Room' },
]
const menuActions: CustomAction[] = [
	{ name: 'inviteUser', title: 'Invite User' },
	{ name: 'removeUser', title: 'Remove User' },
	{ name: 'deleteRoom', title: 'Delete Room' },
]
const messageSelectionActions: CustomAction[] = [{ name: 'deleteMessages', title: 'Delete' }]
const styles = { container: { borderRadius: '4px' } }
const templatesText: TemplateText[] = [
	{ tag: 'help', text: 'This is the help template text.' },
	{ tag: 'action', text: 'This is the action template text.' },
]

const loadedRooms = computed(() => rooms.value)
const screenHeight = computed(() =>
	props.isDevice ? `${window.innerHeight}px` : 'calc(100vh - 80px)',
)

function buildRooms(): Room[] {
	return allRooms.value
		.filter(room => room.users.includes(props.currentUserId))
		.map((room) => {
			const roomUsers = room.users
				.map(userId => allUsers.value.find(u => u._id === userId))
				.filter((u): u is RoomUser => !!u)

			const otherUsers = roomUsers.filter(u => u._id !== props.currentUserId)
			const roomName
				= otherUsers.map(u => u.username).join(', ') || 'Yourself'
			const avatar
				= roomUsers.length === 2 ? otherUsers[0]?.avatar : logoAvatar

			const msgs = allMessages.value[room.roomId] || []
			const lastMsg = msgs[msgs.length - 1]

			return {
				roomId: room.roomId,
				roomName,
				avatar,
				users: roomUsers,
				index: room.lastUpdated,
				lastMessage: lastMsg
					? formatLastMessage(lastMsg, roomUsers)
					: undefined,
				typingUsers: [],
			}
		})
}

function fetchRooms() {
	loadingRooms.value = true

	setTimeout(() => {
		rooms.value = buildRooms()
		loadingRooms.value = false
		roomsLoaded.value = true
	}, 200)
}

function fetchMoreRooms() {
	// All rooms are loaded at once in local demo
}

function fetchMessages({ room, options = {} }: FetchMessagesEvent) {
	if (options.reset) {
		messages.value = []
		messagesLoaded.value = false
	}

	selectedRoom.value = room

	setTimeout(() => {
		const rawMessages = allMessages.value[room.roomId] || []
		messages.value = rawMessages.map(msg => formatMessage(room, msg))
		messagesLoaded.value = true
	}, 100)
}

function formatMessage(room: Room, message: SeedMessage): Message {
	const date
		= message.timestamp instanceof Date
			? message.timestamp
			: new Date(message.timestamp)

	return {
		...message,
		timestamp: formatTime(date),
		date: dateFormatter.format(date),
		username: room.users?.find(u => u._id === message.senderId)?.username,
		distributed: true,
	}
}

function formatLastMessage(message: SeedMessage, roomUsers: RoomUser[]) {
	const date
		= message.timestamp instanceof Date
			? message.timestamp
			: new Date(message.timestamp)
	const isToday = new Date().toDateString() === date.toDateString()
	const timeStr = formatTime(date)

	const username
		= message.senderId !== props.currentUserId
			? roomUsers.find(u => u._id === message.senderId)?.username
			: ''

	return {
		...message,
		content: message.deleted ? 'This message was deleted' : message.content,
		senderId: message.senderId,
		timestamp: isToday
			? `Today, ${timeStr}`
			: new Intl.DateTimeFormat('en-GB').format(date),
		username,
		distributed: true,
		seen: message.senderId === props.currentUserId,
		new: false,
	}
}

function sendMessage({ content, roomId: msgRoomId, files, replyMessage }: SendMessageEvent) {
	const newMessage: SeedMessage = {
		_id: `msg-${nextMessageId++}`,
		senderId: props.currentUserId,
		content,
		timestamp: new Date(),
	}

	if (files) {
		newMessage.files = formattedFiles(files)
	}

	if (replyMessage) {
		newMessage.replyMessage = {
			_id: replyMessage._id,
			content: replyMessage.content || '',
			senderId: replyMessage.senderId,
		}
	}

	if (!allMessages.value[msgRoomId])
		allMessages.value[msgRoomId] = []
	allMessages.value[msgRoomId].push(newMessage)

	const room = allRooms.value.find(r => r.roomId === msgRoomId)
	if (room)
		room.lastUpdated = Date.now()

	if (selectedRoom.value?.roomId === msgRoomId) {
		messages.value = allMessages.value[msgRoomId].map(msg =>
			formatMessage(selectedRoom.value!, msg),
		)
	}

	rooms.value = buildRooms()
}

function editMessage({ messageId, newContent, roomId: msgRoomId, files }: EditMessageEvent) {
	const roomMessages = allMessages.value[msgRoomId]
	if (!roomMessages)
		return

	const message = roomMessages.find(m => m._id === messageId)
	if (!message)
		return

	message.content = newContent
	message.edited = true
	if (files) {
		message.files = formattedFiles(files)
	}
	else {
		delete message.files
	}

	if (selectedRoom.value?.roomId === msgRoomId) {
		messages.value = roomMessages.map(m =>
			formatMessage(selectedRoom.value!, m),
		)
	}
	rooms.value = buildRooms()
}

function deleteMessage({ message, roomId: msgRoomId }: DeleteMessageEvent) {
	const roomMessages = allMessages.value[msgRoomId]
	if (!roomMessages)
		return

	const msg = roomMessages.find(m => m._id === message._id)
	if (msg) {
		msg.deleted = true
		msg.content = ''
		delete msg.files
		delete msg.replyMessage
	}

	if (selectedRoom.value?.roomId === msgRoomId) {
		messages.value = roomMessages.map(m =>
			formatMessage(selectedRoom.value!, m),
		)
	}
	rooms.value = buildRooms()
}

function sendMessageReaction({ reaction, remove, messageId, roomId: msgRoomId }: SendMessageReactionEvent) {
	const roomMessages = allMessages.value[msgRoomId]
	if (!roomMessages)
		return

	const message = roomMessages.find(m => m._id === messageId)
	if (!message)
		return

	if (!message.reactions)
		message.reactions = {}

	const emoji = reaction
	if (!message.reactions[emoji])
		message.reactions[emoji] = []

	if (remove) {
		message.reactions[emoji] = (message.reactions[emoji] as string[]).filter(
			id => id !== props.currentUserId,
		)
		if (message.reactions[emoji].length === 0)
			delete message.reactions[emoji]
	}
	else {
		if (!(message.reactions[emoji] as string[]).includes(props.currentUserId)) {
			(message.reactions[emoji] as string[]).push(props.currentUserId)
		}
	}

	if (selectedRoom.value?.roomId === msgRoomId) {
		messages.value = roomMessages.map(m =>
			formatMessage(selectedRoom.value!, m),
		)
	}
}

function typingMessage() {
	// No-op for local demo
}

function addRoom() {
	resetForms()
	addNewRoom.value = true
}

function createRoom() {
	disableForm.value = true

	const newUser: RoomUser = {
		_id: `user-${Date.now()}`,
		username: addRoomUsername.value,
		avatar: '',
		status: { state: 'offline', lastChanged: '' },
	}
	allUsers.value.push(newUser)

	const newRoom: SeedRoom = {
		roomId: `room-${nextRoomId++}`,
		users: [props.currentUserId, newUser._id],
		lastUpdated: Date.now(),
	}
	allRooms.value.push(newRoom)
	allMessages.value[newRoom.roomId] = []

	addNewRoom.value = false
	addRoomUsername.value = ''
	disableForm.value = false
	fetchRooms()
}

function addRoomUser() {
	disableForm.value = true

	const newUser: RoomUser = {
		_id: `user-${Date.now()}`,
		username: invitedUsername.value,
		avatar: '',
		status: { state: 'offline', lastChanged: '' },
	}
	allUsers.value.push(newUser)

	const room = allRooms.value.find(r => r.roomId === inviteRoomId.value)
	if (room)
		room.users.push(newUser._id)

	inviteRoomId.value = null
	invitedUsername.value = ''
	disableForm.value = false
	fetchRooms()
}

function deleteRoomUser() {
	disableForm.value = true

	const room = allRooms.value.find(r => r.roomId === removeRoomId.value)
	if (room) {
		room.users = room.users.filter(id => id !== removeUserId.value)
	}

	removeRoomId.value = null
	removeUserId.value = ''
	disableForm.value = false
	fetchRooms()
}

function deleteRoom(targetRoomId: StringNumber) {
	allRooms.value = allRooms.value.filter(r => r.roomId !== targetRoomId)
	delete allMessages.value[targetRoomId]
	fetchRooms()
}

function openUserTag(event: unknown) {
	const { user } = event as { user: RoomUser }
	const existingRoom = rooms.value.find((room) => {
		if (room.users.length !== 2)
			return false
		return (
			room.users.some(u => u._id === user._id)
			&& room.users.some(u => u._id === props.currentUserId)
		)
	})

	if (existingRoom) {
		roomId.value = existingRoom.roomId
		return
	}

	const newRoom: SeedRoom = {
		roomId: `room-${nextRoomId++}`,
		users: [props.currentUserId, user._id],
		lastUpdated: Date.now(),
	}
	allRooms.value.push(newRoom)
	allMessages.value[newRoom.roomId] = []
	roomId.value = newRoom.roomId
	fetchRooms()
}

function openFile({ file }: OpenFileEvent) {
	window.open(file.url, '_blank')
}

function formattedFiles(files: MessageFile[]): MessageFile[] {
	return files.map((file) => {
		const messageFile: MessageFile = {
			name: file.name,
			size: file.size,
			type: file.type,
			extension: file.extension || file.type,
			url: file.localUrl || file.url,
		}

		if (file.audio) {
			messageFile.audio = true
			messageFile.duration = file.duration
		}

		return messageFile
	})
}

function menuActionHandler({ action, roomId: actionRoomId }: MenuActionHandlerEvent) {
	switch (action.name) {
		case 'inviteUser':
			return (inviteRoomId.value = actionRoomId)
		case 'removeUser': {
			removeRoomId.value = actionRoomId
			const room = rooms.value.find(r => r.roomId === actionRoomId)
			removeUsers.value = room?.users || []
			return
		}
		case 'deleteRoom':
			return deleteRoom(actionRoomId)
	}
}

function messageSelectionActionHandler({ action, messages: selectedMessages, roomId: actionRoomId }: MessageSelectionActionHandlerEvent) {
	if (action.name === 'deleteMessages') {
		selectedMessages.forEach((message) => {
			deleteMessage({ message, roomId: actionRoomId })
		})
	}
}

function resetForms() {
	disableForm.value = false
	addNewRoom.value = false
	addRoomUsername.value = ''
	inviteRoomId.value = null
	invitedUsername.value = ''
	removeRoomId.value = null
	removeUserId.value = ''
}

onMounted(() => {
	fetchRooms()
})
</script>

<template>
	<div class="window-container" :class="{ 'window-mobile': isDevice }">
		<form v-if="addNewRoom" @submit.prevent="createRoom">
			<input v-model="addRoomUsername" type="text" placeholder="Add username">
			<button type="submit" :disabled="disableForm || !addRoomUsername">
				Create Room
			</button>
			<button class="button-cancel" @click="addNewRoom = false">
				Cancel
			</button>
		</form>

		<form v-if="inviteRoomId" @submit.prevent="addRoomUser">
			<input v-model="invitedUsername" type="text" placeholder="Add username">
			<button type="submit" :disabled="disableForm || !invitedUsername">
				Add User
			</button>
			<button class="button-cancel" @click="inviteRoomId = null">
				Cancel
			</button>
		</form>

		<form v-if="removeRoomId" @submit.prevent="deleteRoomUser">
			<select v-model="removeUserId">
				<option default value="">
					Select User
				</option>
				<option v-for="user in removeUsers" :key="user._id" :value="user._id">
					{{ user.username }}
				</option>
			</select>
			<button type="submit" :disabled="disableForm || !removeUserId">
				Remove User
			</button>
			<button class="button-cancel" @click="removeRoomId = null">
				Cancel
			</button>
		</form>

		<VueAdvancedChat
			:height="screenHeight"
			:theme="theme"
			:styles="styles"
			:current-user-id="currentUserId"
			:room-id="roomId"
			:rooms="loadedRooms"
			:loading-rooms="loadingRooms"
			:rooms-loaded="roomsLoaded"
			:messages="messages"
			:messages-loaded="messagesLoaded"
			:room-message="roomMessage"
			:room-actions="roomActions"
			:menu-actions="menuActions"
			:message-selection-actions="messageSelectionActions"
			:templates-text="templatesText"
			@fetch-more-rooms="fetchMoreRooms"
			@fetch-messages="fetchMessages"
			@send-message="sendMessage"
			@edit-message="editMessage"
			@delete-message="deleteMessage"
			@open-file="openFile"
			@open-user-tag="openUserTag"
			@add-room="addRoom"
			@room-action-handler="menuActionHandler"
			@menu-action-handler="menuActionHandler"
			@message-selection-action-handler="messageSelectionActionHandler"
			@send-message-reaction="sendMessageReaction"
			@typing-message="typingMessage"
			@toggle-rooms-list="emit('showDemoOptions', $event.opened)"
		/>
	</div>
</template>

<style lang="scss" scoped>
.window-container {
	width: 100%;
}

.window-mobile {
	form {
		padding: 0 10px 10px;
	}
}

form {
	padding-bottom: 20px;
}

input {
	padding: 5px;
	width: 140px;
	height: 21px;
	border-radius: 4px;
	border: 1px solid #d2d6da;
	outline: none;
	font-size: 14px;
	vertical-align: middle;

	&::placeholder {
		color: #9ca6af;
	}
}

button {
	background: #1976d2;
	color: #fff;
	outline: none;
	cursor: pointer;
	border-radius: 4px;
	padding: 8px 12px;
	margin-left: 10px;
	border: none;
	font-size: 14px;
	transition: 0.3s;
	vertical-align: middle;

	&:hover {
		opacity: 0.8;
	}

	&:active {
		opacity: 0.6;
	}

	&:disabled {
		cursor: initial;
		background: #c6c9cc;
		opacity: 0.6;
	}
}

.button-cancel {
	color: #a8aeb3;
	background: none;
	margin-left: 5px;
}

select {
	vertical-align: middle;
	height: 33px;
	width: 152px;
	font-size: 13px;
	margin: 0 !important;
}
</style>
