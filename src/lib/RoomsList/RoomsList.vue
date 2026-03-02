<script setup lang="ts">
import type {
	CustomAction,
	LinkOptions,
	Room,
	StringNumber,
	TextFormatting,
	TextMessages,
} from '@/types'

import { ref, useTemplateRef, watch } from 'vue'
import Loader from '@/components/Loader/Loader.vue'

import filteredItems from '@/utils/filter-items'

import RoomContent from './RoomContent/RoomContent.vue'
import RoomsSearch from './RoomsSearch/RoomsSearch.vue'

const props = withDefaults(
	defineProps<{
		currentUserId: StringNumber
		textMessages: TextMessages
		showRoomsList: boolean
		showSearch: boolean
		showAddRoom: boolean
		textFormatting: TextFormatting
		linkOptions: LinkOptions
		isMobile: boolean
		rooms: Room[]
		loadingRooms: boolean
		roomsLoaded: boolean
		room: Room | Record<string, never>
		customSearchRoomEnabled: boolean
		roomActions: CustomAction[]
		scrollDistance: number
	}>(),
	{
		customSearchRoomEnabled: false,
	},
)

const emit = defineEmits<{
	'add-room': []
	'search-room': [value: string]
	'room-action-handler': [value: { action: CustomAction, roomId: StringNumber }]
	'loading-more-rooms': [value: boolean]
	'fetch-room': [value: { room: Room }]
	'fetch-more-rooms': []
}>()

const root = useTemplateRef<HTMLElement>('root')

const filteredRooms = ref<Room[]>(props.rooms || [])
const observer = ref<IntersectionObserver | null>(null)
const showLoader = ref(true)
const loadingMoreRooms = ref(false)
const selectedRoomId = ref<StringNumber>('')

watch(
	() => props.rooms,
	(newVal, oldVal) => {
		filteredRooms.value = newVal
		if (newVal.length !== oldVal.length || props.roomsLoaded) {
			loadingMoreRooms.value = false
		}
	},
	{ deep: true },
)

watch(
	() => props.loadingRooms,
	(val) => {
		if (!val) {
			setTimeout(() => initIntersectionObserver())
		}
	},
)

watch(loadingMoreRooms, (val) => {
	emit('loading-more-rooms', val)
})

watch(
	() => props.roomsLoaded,
	(val) => {
		if (val) {
			loadingMoreRooms.value = false
			if (!props.loadingRooms) {
				showLoader.value = false
			}
		}
	},
	{ immediate: true },
)

watch(
	() => props.room,
	(val) => {
		if (val && !props.isMobile && 'roomId' in val)
			selectedRoomId.value = val.roomId
	},
	{ immediate: true },
)

function initIntersectionObserver() {
	if (observer.value) {
		showLoader.value = true
		observer.value.disconnect()
	}

	const loader = root.value?.querySelector('#infinite-loader-rooms')

	if (loader) {
		const options = {
			root: root.value?.querySelector('#rooms-list'),
			rootMargin: `${props.scrollDistance}px`,
			threshold: 0,
		}

		observer.value = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				loadMoreRooms()
			}
		}, options)

		observer.value.observe(loader)
	}
}

function searchRoom(ev: Event) {
	if (props.customSearchRoomEnabled) {
		emit('search-room', (ev.target as HTMLInputElement).value)
	}
	else {
		filteredRooms.value = filteredItems(
			props.rooms,
			'roomName',
			(ev.target as HTMLInputElement).value,
		)
	}
}

function openRoom(room: Room) {
	if (room.roomId === (props.room as Room).roomId && !props.isMobile)
		return
	if (!props.isMobile)
		selectedRoomId.value = room.roomId
	emit('fetch-room', { room })
}

function loadMoreRooms() {
	if (loadingMoreRooms.value)
		return

	if (props.roomsLoaded) {
		loadingMoreRooms.value = false
		showLoader.value = false
		return
	}

	emit('fetch-more-rooms')
	loadingMoreRooms.value = true
}
</script>

<template>
	<div
		v-show="showRoomsList"
		ref="root"
		class="vac-rooms-container"
		:class="{
			'vac-rooms-container-full': isMobile,
			'vac-app-border-r': !isMobile,
		}"
	>
		<slot name="rooms-header" />

		<slot name="rooms-list-search">
			<RoomsSearch
				:rooms="rooms"
				:loading-rooms="loadingRooms"
				:text-messages="textMessages"
				:show-search="showSearch"
				:show-add-room="showAddRoom"
				@search-room="searchRoom"
				@add-room="emit('add-room')"
			>
				<template v-for="(idx, name) in $slots" #[name]="data">
					<slot :name="name" v-bind="data" />
				</template>
			</RoomsSearch>
		</slot>

		<Loader :show="loadingRooms" type="rooms">
			<template v-for="(idx, name) in $slots" #[name]="data">
				<slot :name="name" v-bind="data" />
			</template>
		</Loader>

		<div v-if="!loadingRooms && !rooms.length" class="vac-rooms-empty">
			<slot name="rooms-empty">
				{{ textMessages.ROOMS_EMPTY }}
			</slot>
		</div>

		<div v-if="!loadingRooms" id="rooms-list" class="vac-room-list">
			<div
				v-for="fRoom in filteredRooms"
				:id="String(fRoom.roomId)"
				:key="fRoom.roomId"
				class="vac-room-item"
				:class="{ 'vac-room-selected': selectedRoomId === fRoom.roomId }"
				@click="openRoom(fRoom)"
			>
				<RoomContent
					:current-user-id="currentUserId"
					:room="fRoom"
					:text-formatting="textFormatting"
					:link-options="linkOptions"
					:text-messages="textMessages"
					:room-actions="roomActions"
					@room-action-handler="emit('room-action-handler', $event)"
				>
					<template v-for="(idx, name) in $slots" #[name]="data">
						<slot :name="name" v-bind="data" />
					</template>
				</RoomContent>
			</div>
			<transition name="vac-fade-message">
				<div v-if="rooms.length && !loadingRooms" id="infinite-loader-rooms">
					<Loader :show="showLoader" :infinite="true" type="infinite-rooms">
						<template v-for="(idx, name) in $slots" #[name]="data">
							<slot :name="name" v-bind="data" />
						</template>
					</Loader>
				</div>
			</transition>
		</div>
	</div>
</template>
