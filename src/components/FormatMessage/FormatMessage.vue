<script setup lang="ts">
import type {
	LinkOptions,
	RoomUser,
	StringNumber,
	TextFormatting,
	I18n
} from '@/types'

import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import { IMAGE_TYPES } from '@/utils/constants'
import markdown from '@/utils/markdown'

interface ParsedMessage {
	types?: string[]
	value: string
	markdown?: boolean
	tag?: boolean
	url?: boolean
	href?: string
	image?: boolean
	height?: string
}

const props = withDefaults(
	defineProps<{
		messageId?: string
		roomId?: StringNumber
		roomList?: boolean
		content: string | number
		deleted?: boolean
		users?: RoomUser[]
		linkify?: boolean
		singleLine?: boolean
		reply?: boolean
		textFormatting: TextFormatting
		i18n?: I18n
		linkOptions: LinkOptions
	}>(),
	{
		messageId: '',
		roomId: '',
		roomList: false,
		deleted: false,
		users: () => [],
		linkify: true,
		singleLine: false,
		reply: false,
    i18n: undefined,
	}
)

const emit = defineEmits<{
	'open-user-tag': [user: RoomUser | undefined]
}>()

function checkType(message: ParsedMessage, type: string): boolean {
	return !!message.types && message.types.indexOf(type) !== -1
}

function checkImageType(message: ParsedMessage): boolean {
	let index = message.value.lastIndexOf('.')
	const slashIndex = message.value.lastIndexOf('/')
	if (slashIndex > index) index = -1

	const type = message.value.substring(index + 1, message.value.length)

	const isMedia =
		index > 0 && IMAGE_TYPES.some(t => type.toLowerCase().includes(t))

	if (isMedia) setImageSize(message)

	return isMedia
}

function setImageSize(message: ParsedMessage): void {
	const image = new Image()
	image.src = message.value

	image.addEventListener('load', onLoad)

	function onLoad(img: Event) {
		const target = (img as any).path?.[0] ?? img.target
		const ratio = target.width / 150
		message.height = Math.round(target.height / ratio) + 'px'
		image.removeEventListener('load', onLoad)
	}
}

function openTag(event: MouseEvent): void {
	const target = event.target as HTMLElement
	const userId = target.getAttribute('data-user-id')
	if (!props.singleLine && userId) {
		const user = props.users.find(u => String(u._id) === userId)
		emit('open-user-tag', user)
	}
}

const parsedMessage = computed<ParsedMessage[]>(() => {
	if (props.deleted) {
		return [{ value: props.i18n?.messageDeleted as string }]
	}

	let options: { textFormatting?: Record<string, unknown> }
	if (!props.textFormatting.disabled) {
		options = {
			textFormatting: {
				linkify: props.linkify,
				linkOptions: props.linkOptions,
				singleLine: props.singleLine,
				reply: props.reply,
				users: props.users,
				...props.textFormatting
			}
		}
	} else {
		options = {}
	}

	const message: ParsedMessage[] = markdown(
		String(props.content ?? ''),
		options
	)

	message.forEach(m => {
		m.markdown = checkType(m, 'markdown')
		m.tag = checkType(m, 'tag')
		m.image = checkImageType(m)
	})

	return message
})
</script>

<template>
	<div
		class="vac-format-message-wrapper"
		:class="{ 'vac-text-ellipsis': singleLine }"
	>
		<template v-for="(message, i) in parsedMessage" :key="i">
			<div
				v-if="message.markdown"
				class="markdown"
				@click="openTag"
				v-html="message.value"
			/>
			<div
				v-else
				class="vac-format-container"
				:class="{ 'vac-text-ellipsis': singleLine }"
			>
				<component
					:is="message.url ? 'a' : 'span'"
					:class="{
						'vac-text-ellipsis': singleLine,
						'vac-text-tag': !singleLine && !reply && message.tag
					}"
					:href="message.href"
					:target="message.href ? linkOptions.target : null"
					:rel="message.href ? linkOptions.rel : null"
				>
					<template v-if="deleted">
						<slot
							:name="
								roomList
									? 'deleted-icon-room_' + roomId
									: 'deleted-icon_' + messageId
							"
						>
							<svg-icon
								name="deleted"
								class="vac-icon-deleted"
								:class="{ 'vac-icon-deleted-room': roomList }"
							/>
						</slot>
						{{ i18n?.messageDeleted }}
					</template>
					<template v-else-if="message.url && message.image">
						<div class="vac-image-link-container">
							<div
								class="vac-image-link"
								:style="{
									'background-image': `url('${message.value}')`,
									height: message.height
								}"
							/>
						</div>
						<div class="vac-image-link-message">
							{{ message.value }}
						</div>
					</template>
					<template v-else>
						{{ message.value }}
					</template>
				</component>
			</div>
		</template>
	</div>
</template>
