<script setup lang="ts">
import type { Room, I18n } from '@/types'

import { computed } from 'vue'

import SvgIcon from '../../../components/SvgIcon/SvgIcon.vue'

const props = defineProps<{
	i18n: I18n
	showSearch: boolean
	showAddRoom: boolean
	rooms: Room[]
	loadingRooms: boolean
}>()

defineEmits<{
	'search-room': [event: Event]
	'add-room': []
}>()

const showSearchBar = computed(() => props.showSearch || props.showAddRoom)
</script>

<template>
	<div
		:class="{
			'vac-box-search': showSearchBar,
			'vac-box-empty': !showSearchBar
		}"
	>
		<template v-if="showSearch">
			<div v-if="!loadingRooms && rooms.length" class="vac-icon-search">
				<slot name="search-icon">
					<SvgIcon name="search" />
				</slot>
			</div>
			<input
				v-if="!loadingRooms && rooms.length"
				type="search"
				:placeholder="i18n.search"
				autocomplete="off"
				class="vac-input"
				@input="$emit('search-room', $event)"
			/>
		</template>
		<div
			v-if="showAddRoom"
			class="vac-svg-button vac-add-icon"
			@click="$emit('add-room')"
		>
			<slot name="add-icon">
				<SvgIcon name="add" />
			</slot>
		</div>
	</div>
</template>
