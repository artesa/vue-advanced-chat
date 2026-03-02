<script setup lang="ts">
import { OnClickOutside } from '@vueuse/components'
import { ref, useTemplateRef, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import { findParentBySelector } from '@/utils/element-selector'
import { I18n } from '@/types'

const props = withDefaults(
	defineProps<{
		emojiOpened?: boolean
		emojiReaction?: boolean
		positionTop?: boolean
		positionRight?: boolean
		messageId?: string
		emojiDataSource?: string
		teleportTarget?: HTMLElement
		i18n: I18n
	}>(),
	{
		emojiOpened: false,
		emojiReaction: false,
		positionTop: false,
		positionRight: false,
		messageId: '',
		emojiDataSource: undefined,
		teleportTarget: undefined
	}
)

const emit = defineEmits<{
	'add-emoji': [payload: { unicode: string }]
	'open-emoji': [value: boolean]
	'close-emoji': []
}>()

const emojiPickerHeight = ref(320)
const emojiPickerTop = ref(0)
const emojiPickerRight = ref('')

const root = useTemplateRef<HTMLElement>('root')
const toggleButton = useTemplateRef<HTMLElement>('toggleButton')
const emojiPicker = useTemplateRef<HTMLElement>('emojiPicker')

watch(
	() => props.emojiOpened,
	val => {
		if (val) {
			setTimeout(() => {
				if (!emojiPicker.value?.shadowRoot) return

				addCustomStyling()

				emojiPicker.value.shadowRoot.addEventListener(
					'emoji-click',
					({ detail }: any) => {
						emit('add-emoji', {
							unicode: detail.unicode
						})
					}
				)
			}, 0)
		}
	}
)

function addCustomStyling(): void {
	const picker = `.picker {
				border: none;
			}`

	const nav = `.nav {
				overflow-x: auto;
			}`

	const searchBox = `.search-wrapper {
				padding-right: 2px;
				padding-left: 2px;
			}`

	const search = `input.search {
				height: 32px;
				font-size: 14px;
				border-radius: 10rem;
				border: var(--chat-border-style);
				padding: 5px 10px;
				outline: none;
				background: var(--chat-bg-color-input);
				color: var(--chat-color);
			}`

	const style = document.createElement('style')
	style.textContent = picker + nav + searchBox + search
	emojiPicker.value!.shadowRoot!.appendChild(style)
}

function openEmoji(ev: MouseEvent): void {
	emit('open-emoji', !props.emojiOpened)
	setEmojiPickerPosition(ev.clientY, ev.view!.innerWidth, ev.view!.innerHeight)
}

function closeEmoji(): void {
	emit('open-emoji', false)
}

function setEmojiPickerPosition(
	clientY: number,
	innerWidth: number,
	innerHeight: number
): void {
	const mobileSize = innerWidth < 500 || innerHeight < 700
	const roomFooterRef = findParentBySelector(root.value, '#room-footer')

	if (!roomFooterRef) {
		if (mobileSize) emojiPickerRight.value = '-50px'
		return
	}

	if (mobileSize) {
		emojiPickerRight.value = `${innerWidth / 2 - (props.positionTop ? 200 : 150)}px`
		emojiPickerTop.value = 100
		emojiPickerHeight.value = innerHeight - 200
	} else if (props.positionTop) {
		const rect = root.value!.getBoundingClientRect()
		emojiPickerTop.value = Math.max(10, rect.top - emojiPickerHeight.value - 10)
		emojiPickerRight.value = `${innerWidth - rect.right}px`
	} else {
		const roomFooterTop = roomFooterRef.getBoundingClientRect().top
		const pickerTopPosition =
			roomFooterTop - clientY > emojiPickerHeight.value - 50

		if (pickerTopPosition) emojiPickerTop.value = clientY + 10
		else emojiPickerTop.value = clientY - emojiPickerHeight.value - 10

		emojiPickerRight.value = props.positionRight ? '60px' : ''
	}
}
</script>

<template>
	<div ref="root" class="vac-emoji-wrapper">
		<div
			ref="toggleButton"
			class="vac-svg-button"
			:class="{ 'vac-emoji-reaction': emojiReaction }"
			@click="openEmoji"
		>
			<slot
				:name="
					messageId
						? `emoji-picker-reaction-icon_${messageId}`
						: 'emoji-picker-icon'
				"
			>
				<SvgIcon name="emoji" :param="emojiReaction ? 'reaction' : ''" />
			</slot>
		</div>

		<template v-if="emojiOpened">
			<template v-if="teleportTarget">
				<Teleport :to="teleportTarget">
					<transition name="vac-slide-up" appear>
						<OnClickOutside
							:options="{ ignore: [toggleButton!] }"
							@trigger="closeEmoji"
						>
							<div
								class="vac-emoji-picker"
								:class="{ 'vac-picker-reaction': emojiReaction }"
								:style="{
									position: positionTop ? 'fixed' : undefined,
									height: `${emojiPickerHeight}px`,
									top: `${emojiPickerTop}px`,
									bottom: positionTop ? 'auto' : undefined,
									right: emojiPickerRight,
									display: emojiPickerTop || !emojiReaction ? 'initial' : 'none'
								}"
							>
								<emoji-picker
									v-if="emojiOpened"
									ref="emojiPicker"
									:data-source="emojiDataSource"
									:i18n="i18n.emojiPicker"
								/>
							</div>
						</OnClickOutside>
					</transition>
				</Teleport>
			</template>
			<template v-else>
				<transition name="vac-slide-up" appear>
					<OnClickOutside
						:options="{ ignore: [toggleButton!] }"
						@trigger="closeEmoji"
					>
						<div
							class="vac-emoji-picker"
							:class="{ 'vac-picker-reaction': emojiReaction }"
							:style="{
								position: positionTop ? 'fixed' : undefined,
								height: `${emojiPickerHeight}px`,
								top: `${emojiPickerTop}px`,
								bottom: positionTop ? 'auto' : undefined,
								right: emojiPickerRight,
								display: emojiPickerTop || !emojiReaction ? 'initial' : 'none'
							}"
						>
							<emoji-picker
								v-if="emojiOpened"
								ref="emojiPicker"
								:data-source="emojiDataSource"
								:i18n="i18n.emojiPicker"
							/>
						</div>
					</OnClickOutside>
				</transition>
			</template>
		</template>
	</div>
</template>
