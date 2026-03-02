<script setup lang="ts">
import type { Message, StringNumber } from '@/types'

defineProps<{
	currentUserId: StringNumber
	message: Message
}>()

const emit = defineEmits<{
	'send-message-reaction': [payload: { emoji: { unicode: string }, reaction: StringNumber[] }]
}>()

function sendMessageReaction(emoji: { unicode: string }, reaction: StringNumber[]) {
	emit('send-message-reaction', { emoji, reaction })
}
</script>

<template>
	<transition-group v-if="!message.deleted" name="vac-slide-left" tag="span">
		<button
			v-for="(reaction, key) in message.reactions"
			v-show="reaction.length"
			:key="key + 0"
			class="vac-button-reaction"
			:class="{
				'vac-reaction-me': reaction.includes(currentUserId),
			}"
			:style="{
				float: message.senderId === currentUserId ? 'right' : 'left',
			}"
			@click="sendMessageReaction({ unicode: key }, reaction)"
		>
			{{ key }}<span>{{ reaction.length }}</span>
		</button>
	</transition-group>
</template>
