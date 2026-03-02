<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
	filteredEmojis: string[]
	selectItem: boolean | null
	activeUpOrDown: number | null
}>()

const emit = defineEmits<{
	'select-emoji': [emoji: string]
	'activate-item': []
}>()

const activeItem = ref<number | null>(null)

watch(() => props.filteredEmojis, (val, oldVal) => {
	if (!oldVal.length || val.length !== oldVal.length) {
		activeItem.value = 0
	}
})

watch(() => props.selectItem, (val) => {
	if (val) {
		emit('select-emoji', props.filteredEmojis[activeItem.value!])
	}
})

watch(() => props.activeUpOrDown, () => {
	if (
		props.activeUpOrDown! > 0
		&& activeItem.value! < props.filteredEmojis.length - 1
	) {
		activeItem.value!++
	}
	else if (props.activeUpOrDown! < 0 && activeItem.value! > 0) {
		activeItem.value!--
	}
	emit('activate-item')
})
</script>

<template>
	<transition name="vac-slide-up">
		<div v-if="filteredEmojis.length" class="vac-emojis-container">
			<div
				v-for="(emoji, index) in filteredEmojis"
				:key="emoji"
				class="vac-emoji-element"
				:class="{ 'vac-emoji-element-active': index === activeItem }"
				@mouseover="activeItem = index"
				@click="$emit('select-emoji', emoji)"
			>
				{{ emoji }}
			</div>
		</div>
	</transition>
</template>
