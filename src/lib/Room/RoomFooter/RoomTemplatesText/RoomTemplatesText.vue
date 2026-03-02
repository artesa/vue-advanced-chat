<script setup lang="ts">
import type { TemplateText } from '@/types'
import { ref, watch } from 'vue'

const props = defineProps<{
	filteredTemplatesText: TemplateText[]
	selectItem: boolean | null
	activeUpOrDown: number | null
}>()

const emit = defineEmits<{
	'select-template-text': [template: TemplateText]
	'activate-item': []
}>()

const activeItem = ref<number | null>(null)

watch(() => props.filteredTemplatesText, (val, oldVal) => {
	if (!oldVal.length || val.length !== oldVal.length) {
		activeItem.value = 0
	}
})

watch(() => props.selectItem, (val) => {
	if (val) {
		emit(
			'select-template-text',
			props.filteredTemplatesText[activeItem.value!],
		)
	}
})

watch(() => props.activeUpOrDown, () => {
	if (
		props.activeUpOrDown! > 0
		&& activeItem.value! < props.filteredTemplatesText.length - 1
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
		<div
			v-if="filteredTemplatesText.length"
			class="vac-template-container vac-app-box-shadow"
		>
			<div
				v-for="(template, index) in filteredTemplatesText"
				:key="index"
				class="vac-template-box"
				:class="{ 'vac-template-active': index === activeItem }"
				@mouseover="activeItem = index"
				@click="$emit('select-template-text', template)"
			>
				<div class="vac-template-info">
					<div class="vac-template-tag">
						/{{ template.tag }}
					</div>
					<div class="vac-template-text">
						{{ template.text }}
					</div>
				</div>
			</div>
		</div>
	</transition>
</template>
