<script>
export default {
	name: 'MessageReactions',

	props: {
		currentUserId: { type: [String, Number], required: true },
		message: { type: Object, required: true },
	},

	emits: ['send-message-reaction'],

	methods: {
		sendMessageReaction(emoji, reaction) {
			this.$emit('send-message-reaction', { emoji, reaction })
		},
	},
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
