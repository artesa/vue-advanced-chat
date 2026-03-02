<script setup lang="ts">
import type { LinkOptions, Message, MessageFile, Room, RoomEditMessageEvent, RoomSendMessageEvent, RoomUser, StringNumber, TemplateText, TextFormatting, TextMessages } from '@/types'
import type { NativeEmoji } from 'emoji-picker-element/shared'
import { Database } from 'emoji-picker-element'

import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import EmojiPickerContainer from '@/components/EmojiPickerContainer/EmojiPickerContainer.vue'

import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import { detectChrome } from '@/utils/browser-detection'
import filteredItems from '@/utils/filter-items'
import { detectMobile } from '@/utils/mobile-detection'
import vClickOutside from '@/utils/on-click-outside'

import Recorder, { mimeToExtension } from '@/utils/recorder'

import RoomEmojis from './RoomEmojis/RoomEmojis.vue'
import RoomFiles from './RoomFiles/RoomFiles.vue'
import RoomMessageReply from './RoomMessageReply/RoomMessageReply.vue'
import RoomTemplatesText from './RoomTemplatesText/RoomTemplatesText.vue'
import RoomUsersTag from './RoomUsersTag/RoomUsersTag.vue'

const props = withDefaults(defineProps<{
	room: Room
	roomId: StringNumber
	roomMessage: string | null
	textFormatting: TextFormatting
	linkOptions: LinkOptions
	textMessages: TextMessages
	showSendIcon: boolean
	showFiles: boolean
	showAudio: boolean
	showEmojis: boolean
	showFooter: boolean
	acceptedFiles: string
	multipleFiles: boolean
	captureFiles?: string
	textareaActionEnabled: boolean
	textareaAutoFocus: boolean
	userTagsEnabled: boolean
	emojisSuggestionEnabled: boolean
	templatesText: TemplateText[] | null
	initReplyMessage: Message | null
	initEditMessage: Message | null
	droppedFiles: File[] | null
	emojiDataSource: string | undefined
}>(), {
	roomMessage: null,
	multipleFiles: true,
	templatesText: null,
	initReplyMessage: null,
	initEditMessage: null,
	droppedFiles: null,
	emojiDataSource: undefined,
})

const emit = defineEmits<{
	'edit-message': [value: RoomEditMessageEvent]
	'send-message': [value: RoomSendMessageEvent]
	'update-edited-message-id': [value: string | undefined]
	'textarea-action-handler': [value: string]
	'typing-message': [value: string | null]
}>()

const roomTextarea = useTemplateRef<HTMLTextAreaElement>('roomTextarea')
const fileRef = useTemplateRef<HTMLInputElement>('file')

const message = ref('')
const editedMessage = ref<Partial<Message>>({})
const messageReply = ref<Message | null>(null)
const cursorRangePosition = ref<number | null>(null)
const files = ref<Array<MessageFile & { loading?: boolean }>>([])
const fileDialog = ref(false)
const selectUsersTagItem = ref<boolean | null>(null)
const selectEmojiItem = ref<boolean | null>(null)
const selectTemplatesTextItem = ref<boolean | null>(null)
const activeUpOrDownEmojis = ref<number | null>(null)
const activeUpOrDownUsersTag = ref<number | null>(null)
const activeUpOrDownTemplatesText = ref<number | null>(null)
const emojisDB = new Database({ dataSource: props.emojiDataSource })
const emojiOpened = ref(false)
const keepKeyboardOpen = ref(false)
const filteredEmojis = ref<string[]>([])
const filteredUsersTag = ref<any[]>([])
const selectedUsersTag = ref<any[]>([])
const filteredTemplatesText = ref<TemplateText[]>([])
const isRecording = ref(false)

function initRecorder() {
	isRecording.value = false

	return new Recorder({
		micFailed,
	})
}

const recorder = ref(initRecorder())

function micFailed() {
	isRecording.value = false
	recorder.value = initRecorder()
}

const isMessageEmpty = computed(() => {
	return !files.value.length && !message.value.trim()
})

const isFileLoading = computed(() => {
	return files.value.some(e => e.loading)
})

const recordedTime = computed(() => {
	return new Date(recorder.value.duration * 1000).toISOString().substr(14, 5)
})

const shadowFooter = computed(() => {
	return (
		!!filteredEmojis.value.length
		|| !!filteredUsersTag.value.length
		|| !!filteredTemplatesText.value.length
		|| !!files.value.length
		|| !!messageReply.value
	)
})

watch(() => props.roomId, () => {
	resetMessage(true, true)

	if (props.roomMessage) {
		message.value = props.roomMessage
		setTimeout(() => onChangeInput())
	}
})

watch(message, (val) => {
	getTextareaRef()!.value = val
})

watch(() => props.roomMessage, (val) => {
	if (val)
		message.value = props.roomMessage!
}, { immediate: true })

watch(editedMessage, (val) => {
	emit('update-edited-message-id', val._id)
})

watch(() => props.initReplyMessage, (val) => {
	if (val) {
		replyMessage(val)
	}
})

watch(() => props.initEditMessage, (val) => {
	if (val) {
		editMessage(val)
	}
})

watch(() => props.droppedFiles, (val) => {
	if (val) {
		onFileChange(val)
	}
})

onMounted(() => {
	const isMobile = detectMobile()
	let isComposed = true

	getTextareaRef()!.addEventListener('keyup', (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey && !fileDialog.value) {
			if (isMobile) {
				message.value = `${message.value}\n`
				setTimeout(() => onChangeInput())
			}
			else if (
				isComposed
				&& !filteredEmojis.value.length
				&& !filteredUsersTag.value.length
				&& !filteredTemplatesText.value.length
			) {
				sendMessage()
			}
		}
		isComposed = !e.isComposing

		setTimeout(() => {
			updateFooterLists()
		}, 60)
	})

	getTextareaRef()!.addEventListener('click', () => {
		if (isMobile)
			keepKeyboardOpen.value = true
		updateFooterLists()
	})

	getTextareaRef()!.addEventListener('blur', () => {
		setTimeout(() => {
			resetFooterList()
		}, 100)

		if (isMobile)
			setTimeout(() => (keepKeyboardOpen.value = false))
	})
})

onBeforeUnmount(() => {
	stopRecorder()
})

function getTextareaRef() {
	return roomTextarea.value
}

function focusTextarea(disableMobileFocus?: boolean) {
	if (detectMobile() && disableMobileFocus)
		return
	if (!getTextareaRef())
		return
	getTextareaRef()!.focus()

	if (cursorRangePosition.value) {
		setTimeout(() => {
			const offset = detectChrome() ? 0 : 1
			getTextareaRef()!.setSelectionRange(
				cursorRangePosition.value! + offset,
				cursorRangePosition.value! + offset,
			)
			cursorRangePosition.value = null
		})
	}
}

function onChangeInput() {
	if (getTextareaRef()?.value || getTextareaRef()?.value === '') {
		message.value = getTextareaRef()!.value
	}
	keepKeyboardOpen.value = true
	resizeTextarea()
	emit('typing-message', message.value)
}

function resizeTextarea() {
	const el = getTextareaRef()

	if (!el)
		return

	const padding = window
		.getComputedStyle(el, null)
		.getPropertyValue('padding-top')
		.replace('px', '')

	el.style.height = '0'
	el.style.height = `${el.scrollHeight - Number(padding) * 2}px`
}

function escapeTextarea() {
	if (filteredEmojis.value.length) {
		filteredEmojis.value = []
	}
	else if (filteredUsersTag.value.length) {
		filteredUsersTag.value = []
	}
	else if (filteredTemplatesText.value.length) {
		filteredTemplatesText.value = []
	}
	else {
		resetMessage()
	}
}

function onPasteImage(pasteEvent: ClipboardEvent) {
	const items = pasteEvent.clipboardData?.items

	if (items) {
		Array.from(items).forEach((item) => {
			if (item.type.includes('image')) {
				const blob = item.getAsFile()
				if (blob)
					onFileChange([blob])
			}
		})
	}
}

function updateActiveUpOrDown(event: KeyboardEvent, direction: number) {
	if (filteredEmojis.value.length) {
		activeUpOrDownEmojis.value = direction
		event.preventDefault()
	}
	else if (filteredUsersTag.value.length) {
		activeUpOrDownUsersTag.value = direction
		event.preventDefault()
	}
	else if (filteredTemplatesText.value.length) {
		activeUpOrDownTemplatesText.value = direction
		event.preventDefault()
	}
}

function selectItem() {
	if (filteredEmojis.value.length) {
		selectEmojiItem.value = true
	}
	else if (filteredUsersTag.value.length) {
		selectUsersTagItem.value = true
	}
	else if (filteredTemplatesText.value.length) {
		selectTemplatesTextItem.value = true
	}
}

function selectEmoji(emoji: string) {
	selectEmojiItem.value = false

	if (!emoji)
		return

	const { position, endPosition } = getCharPosition(':')

	message.value
		= message.value.substr(0, position - 1)
			+ emoji
			+ message.value.substr(endPosition, message.value.length - 1)

	cursorRangePosition.value = position
	focusTextarea()
}

function selectTemplateText(template: TemplateText) {
	selectTemplatesTextItem.value = false

	if (!template)
		return

	const { position, endPosition } = getCharPosition('/')

	const space = message.value.substr(endPosition, endPosition).length
		? ''
		: ' '

	message.value
		= message.value.substr(0, position - 1)
			+ template.text
			+ space
			+ message.value.substr(endPosition, message.value.length - 1)

	cursorRangePosition.value
		= position + template.text.length + space.length + 1

	focusTextarea()
}

function addEmoji(emoji: { unicode: string }) {
	message.value += emoji.unicode
	focusTextarea(true)
}

function launchFilePicker() {
	fileRef.value!.value = ''
	fileRef.value!.click()
}

async function onFileChange(inputFiles: FileList | File[]) {
	fileDialog.value = true
	focusTextarea()

	Array.from(inputFiles).forEach(async (file) => {
		const fileURL = URL.createObjectURL(file)
		const typeIndex = file.name.lastIndexOf('.')

		files.value.push({
			loading: true,
			name: file.name.substring(0, typeIndex),
			size: file.size,
			type: file.type,
			extension: file.name.substring(typeIndex + 1),
			localUrl: fileURL,
			url: '',
		})

		const blobFile = await fetch(fileURL).then(res => res.blob())

		const loadedFile = files.value.find(f => f.localUrl === fileURL)

		if (loadedFile) {
			loadedFile.blob = blobFile
			loadedFile.loading = false
			delete loadedFile.loading
		}
	})

	setTimeout(() => (fileDialog.value = false), 500)
}

function removeFile(index: number) {
	files.value.splice(index, 1)
	focusTextarea()
}

async function toggleRecorder(recording: boolean) {
	isRecording.value = recording

	if (!recorder.value.isRecording) {
		setTimeout(() => recorder.value.start(), 200)
	}
	else {
		try {
			await recorder.value.stop()

			const record = recorder.value.records[0]
			const extension = mimeToExtension(recorder.value.mimeType)

			files.value.push({
				blob: record.blob,
				name: `audio.${extension}`,
				size: record.blob.size,
				duration: record.duration,
				type: record.blob.type,
				audio: true,
				localUrl: URL.createObjectURL(record.blob),
				url: '',
				extension,
			})

			recorder.value = initRecorder()
			sendMessage()
		}
		catch {
			setTimeout(() => stopRecorder(), 100)
		}
	}
}

async function stopRecorder() {
	if (recorder.value.isRecording) {
		try {
			await recorder.value.stop()
			recorder.value = initRecorder()
		}
		catch {
			setTimeout(() => stopRecorder(), 100)
		}
	}
}

function textareaActionHandler() {
	emit('textarea-action-handler', message.value)
}

function sendMessage() {
	let msg = message.value.trim()

	if (!files.value.length && !msg)
		return

	if (isFileLoading.value)
		return

	selectedUsersTag.value.forEach((user) => {
		msg = msg.replace(
			`@${user.username}`,
			`<usertag>${user._id}</usertag>`,
		)
	})

	const messageFiles = files.value.length ? files.value : undefined

	if (editedMessage.value._id) {
		if (
			editedMessage.value.content !== msg
			|| editedMessage.value.files?.length
			|| files.value.length
		) {
			emit('edit-message', {
				messageId: editedMessage.value._id!,
				newContent: msg,
				files: messageFiles,
				replyMessage: messageReply.value,
				usersTag: selectedUsersTag.value,
			})
		}
	}
	else {
		emit('send-message', {
			content: msg,
			files: messageFiles,
			replyMessage: messageReply.value,
			usersTag: selectedUsersTag.value,
		})
	}

	resetMessage(true)
}

function editMessage(msg: Message) {
	resetMessage()

	editedMessage.value = { ...msg }

	let messageContent = msg.content || ''
	const initialContent = messageContent

	const firstTag = '<usertag>'
	const secondTag = '</usertag>'

	const usertags = [
		...messageContent.matchAll(new RegExp(firstTag, 'gi')),
	].map(a => a.index)

	usertags.forEach((index) => {
		if (index === undefined)
			return
		const userId = initialContent.substring(
			index + firstTag.length,
			initialContent.indexOf(secondTag, index),
		)

		const user = props.room.users.find(user => user._id === userId)

		messageContent = messageContent.replace(
			`${firstTag}${userId}${secondTag}`,
			`@${user?.username || 'unknown'}`,
		)

		selectUserTag(user, true)
	})

	message.value = messageContent

	if (msg.files) {
		files.value = [...msg.files]
	}

	setTimeout(() => resizeTextarea())
}

function replyMessage(msg: Message) {
	editedMessage.value = {}
	messageReply.value = msg
	focusTextarea()
}

function updateFooterLists() {
	updateFooterList('@')
	updateFooterList(':')
	updateFooterList('/')
}

function updateFooterList(tagChar: string) {
	if (!getTextareaRef())
		return

	if (tagChar === ':' && !props.emojisSuggestionEnabled) {
		return
	}

	if (tagChar === '@' && (!props.userTagsEnabled || !props.room.users)) {
		return
	}

	if (tagChar === '/' && !props.templatesText) {
		return
	}

	const textareaCursorPosition = getTextareaRef()!.selectionStart

	let position = textareaCursorPosition

	while (
		position > 0
		&& message.value.charAt(position - 1) !== tagChar
		// eslint-disable-next-line no-unmodified-loop-condition
		&& (message.value.charAt(position - 1) !== ' ' || tagChar !== ':')
	) {
		position--
	}

	const beforeTag = message.value.charAt(position - 2)
	const notLetterNumber = !beforeTag.match(/^[0-9a-z]+$/i)

	if (
		message.value.charAt(position - 1) === tagChar
		&& (!beforeTag || beforeTag === ' ' || notLetterNumber)
	) {
		const query = message.value.substring(position, textareaCursorPosition)
		if (tagChar === ':') {
			updateEmojis(query)
		}
		else if (tagChar === '@') {
			updateShowUsersTag(query)
		}
		else if (tagChar === '/') {
			updateShowTemplatesText(query)
		}
	}
	else {
		resetFooterList(tagChar)
	}
}

function updateShowUsersTag(query: string) {
	filteredUsersTag.value = filteredItems(
		props.room.users as any,
		'username',
		query,
		true,
	)
}

function selectUserTag(user: RoomUser | undefined, editMode = false) {
	selectUsersTagItem.value = false

	if (!user)
		return

	const { position, endPosition } = getCharPosition('@')

	const space = message.value.substr(endPosition, endPosition).length
		? ''
		: ' '

	message.value
		= message.value.substr(0, position)
			+ user.username
			+ space
			+ message.value.substr(endPosition, message.value.length - 1)

	selectedUsersTag.value = [...selectedUsersTag.value, { ...user }]

	if (!editMode) {
		cursorRangePosition.value
			= position + user.username.length + space.length + 1
	}

	focusTextarea()
}

function updateShowTemplatesText(query: string) {
	filteredTemplatesText.value = filteredItems(
		props.templatesText as TemplateText[],
		'tag',
		query,
		true,
	)
}

function getCharPosition(tagChar: string) {
	const cursorPosition = getTextareaRef()!.selectionStart

	let position = cursorPosition
	while (position > 0 && message.value.charAt(position - 1) !== tagChar) {
		position--
	}

	const endPosition = getTextareaRef()!.selectionEnd

	return { position, endPosition }
}

async function updateEmojis(query: string) {
	if (!query)
		return

	const emojis = await emojisDB.getEmojiBySearchQuery(query)
	filteredEmojis.value = emojis.map((emoji) => (emoji as NativeEmoji).unicode)
}

function resetFooterList(tagChar: string | null = null) {
	if (tagChar === ':') {
		filteredEmojis.value = []
	}
	else if (tagChar === '@') {
		filteredUsersTag.value = []
	}
	else if (tagChar === '/') {
		filteredTemplatesText.value = []
	}
	else {
		filteredEmojis.value = []
		filteredUsersTag.value = []
		filteredTemplatesText.value = []
	}
}

function resetMessage(disableMobileFocus = false, initRoom = false) {
	if (!initRoom) {
		emit('typing-message', null)
	}

	selectedUsersTag.value = []
	resetFooterList()
	resetTextareaSize()
	message.value = ''
	editedMessage.value = {}
	messageReply.value = null
	files.value = []
	emojiOpened.value = false
	preventKeyboardFromClosing()

	if (props.textareaAutoFocus || !initRoom) {
		setTimeout(() => focusTextarea(disableMobileFocus))
	}
}

function resetTextareaSize() {
	if (getTextareaRef()) {
		getTextareaRef()!.style.height = '20px'
	}
}

function preventKeyboardFromClosing() {
	if (keepKeyboardOpen.value)
		getTextareaRef()?.focus()
}
</script>

<template>
	<div
		v-show="Object.keys(room).length && showFooter"
		id="room-footer"
		class="vac-room-footer"
		:class="{
			'vac-app-box-shadow': shadowFooter,
		}"
	>
		<RoomEmojis
			:filtered-emojis="filteredEmojis"
			:select-item="selectEmojiItem"
			:active-up-or-down="activeUpOrDownEmojis"
			@select-emoji="selectEmoji($event)"
			@activate-item="activeUpOrDownEmojis = 0"
		/>

		<RoomUsersTag
			:filtered-users-tag="filteredUsersTag"
			:select-item="selectUsersTagItem"
			:active-up-or-down="activeUpOrDownUsersTag"
			@select-user-tag="selectUserTag($event)"
			@activate-item="activeUpOrDownUsersTag = 0"
		/>

		<RoomTemplatesText
			:filtered-templates-text="filteredTemplatesText"
			:select-item="selectTemplatesTextItem"
			:active-up-or-down="activeUpOrDownTemplatesText"
			@select-template-text="selectTemplateText($event)"
			@activate-item="activeUpOrDownTemplatesText = 0"
		/>

		<RoomMessageReply
			:room="room"
			:message-reply="messageReply"
			:text-formatting="textFormatting"
			:link-options="linkOptions"
			@reset-message="resetMessage"
		>
			<template v-for="(i, name) in $slots" #[name]="data">
				<slot :name="name" v-bind="data" />
			</template>
		</RoomMessageReply>

		<RoomFiles
			:files="files"
			@remove-file="removeFile"
			@reset-message="resetMessage"
		>
			<template v-for="(i, name) in $slots" #[name]="data">
				<slot :name="name" v-bind="data" />
			</template>
		</RoomFiles>

		<div
			class="vac-box-footer"
			:class="{ 'vac-box-footer-border': !files.length }"
		>
			<div v-if="showAudio && !files.length" class="vac-icon-textarea-left">
				<template v-if="isRecording">
					<div class="vac-svg-button vac-icon-audio-stop" @click="stopRecorder">
						<slot name="audio-stop-icon">
							<SvgIcon name="close-outline" />
						</slot>
					</div>

					<div class="vac-dot-audio-record" />

					<div class="vac-dot-audio-record-time">
						{{ recordedTime }}
					</div>

					<div
						class="vac-svg-button vac-icon-audio-confirm"
						@click="toggleRecorder(false)"
					>
						<slot name="audio-check-icon">
							<SvgIcon name="checkmark" />
						</slot>
					</div>
				</template>

				<div v-else class="vac-svg-button" @click="toggleRecorder(true)">
					<slot name="microphone-icon">
						<SvgIcon name="microphone" class="vac-icon-microphone" />
					</slot>
				</div>
			</div>

			<textarea
				id="roomTextarea"
				ref="roomTextarea"
				:placeholder="textMessages.TYPE_MESSAGE"
				class="vac-textarea"
				:class="{
					'vac-textarea-outline': editedMessage._id,
				}"
				:style="{
					'min-height': `20px`,
					'padding-left': `12px`,
				}"
				@input="onChangeInput"
				@keydown.esc="escapeTextarea"
				@keydown.enter.exact.prevent="selectItem"
				@paste="onPasteImage"
				@keydown.tab.exact.prevent=""
				@keydown.tab="selectItem"
				@keydown.up="updateActiveUpOrDown($event, -1)"
				@keydown.down="updateActiveUpOrDown($event, 1)"
			/>

			<div class="vac-icon-textarea">
				<div
					v-if="editedMessage._id"
					class="vac-svg-button"
					@click="resetMessage()"
				>
					<slot name="edit-close-icon">
						<SvgIcon name="close-outline" />
					</slot>
				</div>

				<div v-if="showEmojis" v-click-outside="() => (emojiOpened = false)">
					<slot
						name="emoji-picker"
						v-bind="{ emojiOpened }"
						:add-emoji="addEmoji"
					>
						<EmojiPickerContainer
							:emoji-opened="emojiOpened"
							:position-top="true"
							:emoji-data-source="emojiDataSource"
							@add-emoji="addEmoji"
							@open-emoji="emojiOpened = $event"
						>
							<template #emoji-picker-icon>
								<slot name="emoji-picker-icon" />
							</template>
						</EmojiPickerContainer>
					</slot>
				</div>

				<div v-if="showFiles" class="vac-svg-button" @click="launchFilePicker">
					<slot name="paperclip-icon">
						<SvgIcon name="paperclip" />
					</slot>
				</div>

				<div
					v-if="textareaActionEnabled"
					class="vac-svg-button"
					@click="textareaActionHandler"
				>
					<slot name="custom-action-icon">
						<SvgIcon name="deleted" />
					</slot>
				</div>

				<input
					v-if="showFiles"
					ref="file"
					type="file"
					:multiple="multipleFiles || undefined"
					:accept="acceptedFiles"
					:capture="(captureFiles as any)"
					style="display: none"
					@change="onFileChange(($event.target as HTMLInputElement).files!)"
				>

				<div
					v-if="showSendIcon"
					class="vac-svg-button"
					:class="{ 'vac-send-disabled': isMessageEmpty }"
					@click="sendMessage"
				>
					<slot name="send-icon">
						<SvgIcon
							name="send"
							:param="isMessageEmpty || isFileLoading ? 'disabled' : ''"
						/>
					</slot>
				</div>
			</div>
		</div>
	</div>
</template>
