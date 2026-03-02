<script setup lang="ts">
import type {
	CustomAction,
	LinkOptions,
	Room,
	StringNumber,
	TextFormatting,
	I18n
} from '@/types'

import { computed, ref } from 'vue'
import FormatMessage from '@/components/FormatMessage/FormatMessage.vue'

import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import { isAudioFile } from '@/utils/media-file'
import { vOnClickOutside } from '@vueuse/components'

import typingText from '@/utils/typing-text'

const props = defineProps<{
	currentUserId: StringNumber
	room: Room
	textFormatting: TextFormatting
	linkOptions: LinkOptions
	i18n: I18n
	roomActions: CustomAction[]
}>()

const emit = defineEmits<{
	'room-action-handler': [
		payload: { action: CustomAction; roomId: StringNumber }
	]
}>()

const roomMenuOpened = ref<StringNumber | null>(null)

const typingUsers = computed(() => {
	return typingText(props.room, String(props.currentUserId), props.i18n)
})

const getLastMessage = computed(() => {
	const isTyping = typingUsers.value
	if (isTyping) return isTyping

	const content = props.room.lastMessage!.content

	if (props.room.users.length <= 2) {
		return content
	}

	const user = props.room.users.find(
		user => user._id === props.room.lastMessage!.senderId
	)

	if (props.room.lastMessage!.username) {
		return `${props.room.lastMessage!.username} - ${content}`
	} else if (!user || user._id === props.currentUserId) {
		return content
	}

	return `${user.username} - ${content}`
})

const userStatus = computed(() => {
	if (!props.room.users || props.room.users.length !== 2) return

	const user = props.room.users.find(u => u._id !== props.currentUserId)
	if (user && user.status) return user.status.state

	return null
})

const isMessageCheckmarkVisible = computed(() => {
	return (
		!typingUsers.value &&
		props.room.lastMessage &&
		!props.room.lastMessage.deleted &&
		props.room.lastMessage.senderId === props.currentUserId &&
		(props.room.lastMessage.saved ||
			props.room.lastMessage.distributed ||
			props.room.lastMessage.seen)
	)
})

const formattedDuration = computed(() => {
	const file = props.room.lastMessage?.files?.[0]
	if (file) {
		if (!file.duration) {
			return `${file.name}.${file.extension}`
		}

		let s = Math.floor(file.duration)
		return (s - (s %= 60)) / 60 + (s > 9 ? ':' : ':0') + s
	}
	return ''
})

const isAudio = computed(() => {
	return props.room.lastMessage!.files
		? isAudioFile(props.room.lastMessage!.files[0])
		: false
})

function roomActionHandler(action: CustomAction): void {
	closeRoomMenu()
	emit('room-action-handler', { action, roomId: props.room.roomId })
}

function closeRoomMenu(): void {
	roomMenuOpened.value = null
}
</script>

<template>
	<div class="vac-room-container">
		<slot :name="`room-list-item_${room.roomId}`">
			<slot :name="`room-list-avatar_${room.roomId}`">
				<div
					v-if="room.avatar"
					class="vac-avatar"
					:style="{ 'background-image': `url('${room.avatar}')` }"
				/>
			</slot>
			<div class="vac-name-container vac-text-ellipsis">
				<div class="vac-title-container">
					<div
						v-if="userStatus"
						class="vac-state-circle"
						:class="{ 'vac-state-online': userStatus === 'online' }"
					/>
					<slot :name="`room-list-info_${room.roomId}`">
						<div class="vac-room-name vac-text-ellipsis">
							{{ room.roomName }}
						</div>
					</slot>
					<div v-if="room.lastMessage" class="vac-text-date">
						{{ room.lastMessage.timestamp }}
					</div>
				</div>
				<div
					class="vac-text-last"
					:class="{
						'vac-message-new':
							room.lastMessage && room.lastMessage.new && !typingUsers
					}"
				>
					<span v-if="isMessageCheckmarkVisible">
						<slot :name="`checkmark-icon_${room.roomId}`">
							<SvgIcon
								:name="
									room.lastMessage?.distributed
										? 'double-checkmark'
										: 'checkmark'
								"
								:param="room.lastMessage?.seen ? 'seen' : ''"
								class="vac-icon-check"
							/>
						</slot>
					</span>
					<div
						v-if="room.lastMessage && !room.lastMessage.deleted && isAudio"
						class="vac-text-ellipsis"
					>
						<slot :name="`microphone-icon_${room.roomId}`">
							<SvgIcon name="microphone" class="vac-icon-microphone" />
						</slot>
						{{ formattedDuration }}
					</div>
					<FormatMessage
						v-else-if="room.lastMessage"
						:message-id="room.lastMessage._id"
						:room-id="room.roomId"
						:room-list="true"
						:content="getLastMessage"
						:deleted="!!room.lastMessage.deleted && !typingUsers"
						:users="room.users"
						:i18n="i18n"
						:linkify="false"
						:text-formatting="textFormatting"
						:link-options="linkOptions"
						:single-line="true"
					>
						<template v-for="(idx, name) in $slots" #[name]="data">
							<slot :name="name" v-bind="data" />
						</template>
					</FormatMessage>
					<div
						v-if="!room.lastMessage && typingUsers"
						class="vac-text-ellipsis"
					>
						{{ typingUsers }}
					</div>
					<div class="vac-room-options-container">
						<div
							v-if="room.unreadCount"
							class="vac-badge-counter vac-room-badge"
						>
							{{ room.unreadCount }}
						</div>
						<slot :name="`room-list-options_${room.roomId}`">
							<div
								v-if="roomActions.length"
								class="vac-svg-button vac-list-room-options"
								@click.stop="roomMenuOpened = room.roomId"
							>
								<slot :name="`room-list-options-icon_${room.roomId}`">
									<SvgIcon name="dropdown" param="room" />
								</slot>
							</div>
							<transition v-if="roomActions.length" name="vac-slide-left">
								<div
									v-if="roomMenuOpened === room.roomId"
									v-on-click-outside="closeRoomMenu"
									class="vac-menu-options"
								>
									<div class="vac-menu-list">
										<div v-for="action in roomActions" :key="action.name">
											<div
												class="vac-menu-item"
												@click.stop="roomActionHandler(action)"
											>
												{{ action.title }}
											</div>
										</div>
									</div>
								</div>
							</transition>
						</slot>
					</div>
				</div>
			</div>
		</slot>
	</div>
</template>
