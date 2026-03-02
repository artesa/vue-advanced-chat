<script>
import { VueAdvancedChat } from '@artesa/vue-advanced-chat'
import logoAvatar from '@/assets/logo.png'
import {
	messagesByRoom as seedMessages,
	rooms as seedRooms,
	users as seedUsers,
} from '@/data/mock-data'
import '@artesa/vue-advanced-chat/dist/style.css'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
})

function formatTime(date) {
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default {
	components: {
		VueAdvancedChat,
	},

	props: {
		currentUserId: { type: String, required: true },
		theme: { type: String, required: true },
		isDevice: { type: Boolean, required: true },
	},

	emits: ['showDemoOptions'],

	data() {
		return {
			// In-memory stores
			allUsers: JSON.parse(JSON.stringify(seedUsers)),
			allRooms: JSON.parse(JSON.stringify(seedRooms)),
			allMessages: JSON.parse(JSON.stringify(seedMessages)),
			nextMessageId: 100,
			nextRoomId: 10,

			// Component state
			rooms: [],
			roomId: '',
			roomsLoaded: false,
			loadingRooms: true,
			messages: [],
			messagesLoaded: false,
			roomMessage: '',
			selectedRoom: null,
			disableForm: false,
			addNewRoom: false,
			addRoomUsername: '',
			inviteRoomId: null,
			invitedUsername: '',
			removeRoomId: null,
			removeUserId: '',
			removeUsers: [],

			// Config
			roomActions: [
				{ name: 'inviteUser', title: 'Invite User' },
				{ name: 'removeUser', title: 'Remove User' },
				{ name: 'deleteRoom', title: 'Delete Room' },
			],
			menuActions: [
				{ name: 'inviteUser', title: 'Invite User' },
				{ name: 'removeUser', title: 'Remove User' },
				{ name: 'deleteRoom', title: 'Delete Room' },
			],
			messageSelectionActions: [{ name: 'deleteMessages', title: 'Delete' }],
			styles: { container: { borderRadius: '4px' } },
			templatesText: [
				{
					tag: 'help',
					text: 'This is the help template text.',
				},
				{
					tag: 'action',
					text: 'This is the action template text.',
				},
			],
		}
	},

	computed: {
		loadedRooms() {
			return this.rooms
		},
		screenHeight() {
			return this.isDevice ? `${window.innerHeight}px` : 'calc(100vh - 80px)'
		},
	},

	mounted() {
		this.fetchRooms()
	},

	methods: {
		buildRooms() {
			return this.allRooms
				.filter(room => room.users.includes(this.currentUserId))
				.map((room) => {
					const roomUsers = room.users
						.map(userId => this.allUsers.find(u => u._id === userId))
						.filter(Boolean)

					const otherUsers = roomUsers.filter(u => u._id !== this.currentUserId)
					const roomName =
						otherUsers.map(u => u.username).join(', ') || 'Yourself'
					const avatar =
						roomUsers.length === 2 ? otherUsers[0]?.avatar : logoAvatar

					const msgs = this.allMessages[room.roomId] || []
					const lastMsg = msgs[msgs.length - 1]

					return {
						roomId: room.roomId,
						roomName,
						avatar,
						users: roomUsers,
						index: room.lastUpdated,
						lastMessage: lastMsg
							? this.formatLastMessage(lastMsg, roomUsers)
							: undefined,
						typingUsers: [],
					}
				})
		},

		fetchRooms() {
			this.loadingRooms = true

			setTimeout(() => {
				this.rooms = this.buildRooms()
				this.loadingRooms = false
				this.roomsLoaded = true
			}, 200)
		},

		fetchMoreRooms() {
			// All rooms are loaded at once in local demo
		},

		fetchMessages({ room, options = {} }) {
			if (options.reset) {
				this.messages = []
				this.messagesLoaded = false
			}

			this.selectedRoom = room

			setTimeout(() => {
				const rawMessages = this.allMessages[room.roomId] || []
				this.messages = rawMessages.map(msg => this.formatMessage(room, msg))
				this.messagesLoaded = true
			}, 100)
		},

		formatMessage(room, message) {
			const date =
				message.timestamp instanceof Date
					? message.timestamp
					: new Date(message.timestamp)

			return {
				...message,
				timestamp: formatTime(date),
				date: dateFormatter.format(date),
				username: room.users?.find(u => u._id === message.senderId)?.username,
				distributed: true,
			}
		},

		formatLastMessage(message, roomUsers) {
			const date =
				message.timestamp instanceof Date
					? message.timestamp
					: new Date(message.timestamp)
			const isToday = new Date().toDateString() === date.toDateString()
			const timeStr = formatTime(date)

			const username =
				message.senderId !== this.currentUserId
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
				seen: message.senderId === this.currentUserId,
				new: false,
			}
		},

		sendMessage({ content, roomId, files, replyMessage }) {
			const newMessage = {
				_id: `msg-${this.nextMessageId++}`,
				senderId: this.currentUserId,
				content,
				timestamp: new Date(),
			}

			if (files) {
				newMessage.files = this.formattedFiles(files)
			}

			if (replyMessage) {
				newMessage.replyMessage = {
					_id: replyMessage._id,
					content: replyMessage.content,
					senderId: replyMessage.senderId,
				}
			}

			if (!this.allMessages[roomId]) this.allMessages[roomId] = []
			this.allMessages[roomId].push(newMessage)

			const room = this.allRooms.find(r => r.roomId === roomId)
			if (room) room.lastUpdated = Date.now()

			if (this.selectedRoom?.roomId === roomId) {
				this.messages = this.allMessages[roomId].map(msg =>
					this.formatMessage(this.selectedRoom, msg),
				)
			}

			this.rooms = this.buildRooms()
		},

		editMessage({ messageId, newContent, roomId, files }) {
			const roomMessages = this.allMessages[roomId]
			if (!roomMessages) return

			const message = roomMessages.find(m => m._id === messageId)
			if (!message) return

			message.content = newContent
			message.edited = true
			if (files) {
				message.files = this.formattedFiles(files)
			}
			else {
				delete message.files
			}

			if (this.selectedRoom?.roomId === roomId) {
				this.messages = roomMessages.map(m =>
					this.formatMessage(this.selectedRoom, m),
				)
			}
			this.rooms = this.buildRooms()
		},

		deleteMessage({ message, roomId }) {
			const roomMessages = this.allMessages[roomId]
			if (!roomMessages) return

			const msg = roomMessages.find(m => m._id === message._id)
			if (msg) {
				msg.deleted = true
				msg.content = ''
				delete msg.files
				delete msg.replyMessage
			}

			if (this.selectedRoom?.roomId === roomId) {
				this.messages = roomMessages.map(m =>
					this.formatMessage(this.selectedRoom, m),
				)
			}
			this.rooms = this.buildRooms()
		},

		sendMessageReaction({ reaction, remove, messageId, roomId }) {
			const roomMessages = this.allMessages[roomId]
			if (!roomMessages) return

			const message = roomMessages.find(m => m._id === messageId)
			if (!message) return

			if (!message.reactions) message.reactions = {}

			const emoji = reaction
			if (!message.reactions[emoji]) message.reactions[emoji] = []

			if (remove) {
				message.reactions[emoji] = message.reactions[emoji].filter(
					id => id !== this.currentUserId,
				)
				if (message.reactions[emoji].length === 0)
					delete message.reactions[emoji]
			}
			else {
				if (!message.reactions[emoji].includes(this.currentUserId)) {
					message.reactions[emoji].push(this.currentUserId)
				}
			}

			if (this.selectedRoom?.roomId === roomId) {
				this.messages = roomMessages.map(m =>
					this.formatMessage(this.selectedRoom, m),
				)
			}
		},

		typingMessage() {
			// No-op for local demo
		},

		addRoom() {
			this.resetForms()
			this.addNewRoom = true
		},

		createRoom() {
			this.disableForm = true

			const newUser = {
				_id: `user-${Date.now()}`,
				username: this.addRoomUsername,
				avatar: '',
				status: { state: 'offline', lastChanged: '' },
			}
			this.allUsers.push(newUser)

			const newRoom = {
				roomId: `room-${this.nextRoomId++}`,
				users: [this.currentUserId, newUser._id],
				lastUpdated: Date.now(),
			}
			this.allRooms.push(newRoom)
			this.allMessages[newRoom.roomId] = []

			this.addNewRoom = false
			this.addRoomUsername = ''
			this.disableForm = false
			this.fetchRooms()
		},

		addRoomUser() {
			this.disableForm = true

			const newUser = {
				_id: `user-${Date.now()}`,
				username: this.invitedUsername,
				avatar: '',
				status: { state: 'offline', lastChanged: '' },
			}
			this.allUsers.push(newUser)

			const room = this.allRooms.find(r => r.roomId === this.inviteRoomId)
			if (room) room.users.push(newUser._id)

			this.inviteRoomId = null
			this.invitedUsername = ''
			this.disableForm = false
			this.fetchRooms()
		},

		deleteRoomUser() {
			this.disableForm = true

			const room = this.allRooms.find(r => r.roomId === this.removeRoomId)
			if (room) {
				room.users = room.users.filter(id => id !== this.removeUserId)
			}

			this.removeRoomId = null
			this.removeUserId = ''
			this.disableForm = false
			this.fetchRooms()
		},

		deleteRoom(roomId) {
			this.allRooms = this.allRooms.filter(r => r.roomId !== roomId)
			delete this.allMessages[roomId]
			this.fetchRooms()
		},

		openUserTag({ user }) {
			const existingRoom = this.rooms.find((room) => {
				if (room.users.length !== 2) return false
				return (
					room.users.some(u => u._id === user._id)
					&& room.users.some(u => u._id === this.currentUserId)
				)
			})

			if (existingRoom) {
				this.roomId = existingRoom.roomId
				return
			}

			const newRoom = {
				roomId: `room-${this.nextRoomId++}`,
				users: [this.currentUserId, user._id],
				lastUpdated: Date.now(),
			}
			this.allRooms.push(newRoom)
			this.allMessages[newRoom.roomId] = []
			this.roomId = newRoom.roomId
			this.fetchRooms()
		},

		openFile({ file }) {
			window.open(file.file.url, '_blank')
		},

		formattedFiles(files) {
			const formattedFiles = []

			files.forEach((file) => {
				const messageFile = {
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

				formattedFiles.push(messageFile)
			})

			return formattedFiles
		},

		menuActionHandler({ action, roomId }) {
			switch (action.name) {
				case 'inviteUser':
					return (this.inviteRoomId = roomId)
				case 'removeUser': {
					this.removeRoomId = roomId
					const room = this.rooms.find(r => r.roomId === roomId)
					this.removeUsers = room?.users || []
					return
				}
				case 'deleteRoom':
					return this.deleteRoom(roomId)
			}
		},

		messageSelectionActionHandler({ action, messages, roomId }) {
			if (action.name === 'deleteMessages') {
				messages.forEach((message) => {
					this.deleteMessage({ message, roomId })
				})
			}
		},

		resetForms() {
			this.disableForm = false
			this.addNewRoom = false
			this.addRoomUsername = ''
			this.inviteRoomId = null
			this.invitedUsername = ''
			this.removeRoomId = null
			this.removeUserId = ''
		},
	},
}
</script>

<template>
	<div class="window-container" :class="{ 'window-mobile': isDevice }">
		<form v-if="addNewRoom" @submit.prevent="createRoom">
			<input v-model="addRoomUsername" type="text" placeholder="Add username" />
			<button type="submit" :disabled="disableForm || !addRoomUsername">
				Create Room
			</button>
			<button class="button-cancel" @click="addNewRoom = false">Cancel</button>
		</form>

		<form v-if="inviteRoomId" @submit.prevent="addRoomUser">
			<input v-model="invitedUsername" type="text" placeholder="Add username" />
			<button type="submit" :disabled="disableForm || !invitedUsername">
				Add User
			</button>
			<button class="button-cancel" @click="inviteRoomId = null">Cancel</button>
		</form>

		<form v-if="removeRoomId" @submit.prevent="deleteRoomUser">
			<select v-model="removeUserId">
				<option default value="">Select User</option>
				<option v-for="user in removeUsers" :key="user._id" :value="user._id">
					{{ user.username }}
				</option>
			</select>
			<button type="submit" :disabled="disableForm || !removeUserId">
				Remove User
			</button>
			<button class="button-cancel" @click="removeRoomId = null">Cancel</button>
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
			@toggle-rooms-list="$emit('showDemoOptions', $event.opened)"
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
