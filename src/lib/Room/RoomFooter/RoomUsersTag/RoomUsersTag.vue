<script setup lang="ts">
import type { RoomUser } from '@/types'
import { ref, watch } from 'vue'

const props = defineProps<{
	filteredUsersTag: RoomUser[]
	selectItem: boolean | null
	activeUpOrDown: number | null
}>()

const emit = defineEmits<{
	'select-user-tag': [user: RoomUser]
	'activate-item': []
}>()

const activeItem = ref<number | null>(null)

watch(() => props.filteredUsersTag, (val, oldVal) => {
	if (!oldVal.length || val.length !== oldVal.length) {
		activeItem.value = 0
	}
})

watch(() => props.selectItem, (val) => {
	if (val) {
		emit('select-user-tag', props.filteredUsersTag[activeItem.value!])
	}
})

watch(() => props.activeUpOrDown, () => {
	if (
		props.activeUpOrDown! > 0
		&& activeItem.value! < props.filteredUsersTag.length - 1
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
		<div v-if="filteredUsersTag.length" class="vac-tags-container">
			<div
				v-for="(user, index) in filteredUsersTag"
				:key="user._id"
				class="vac-tags-box"
				:class="{ 'vac-tags-box-active': index === activeItem }"
				@mouseover="activeItem = index"
				@click="$emit('select-user-tag', user)"
			>
				<div class="vac-tags-info">
					<div
						v-if="user.avatar"
						class="vac-avatar vac-tags-avatar"
						:style="{ 'background-image': `url('${user.avatar}')` }"
					/>
					<div class="vac-tags-username">
						{{ user.username }}
					</div>
				</div>
			</div>
		</div>
	</transition>
</template>
