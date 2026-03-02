import { defineCustomElement } from 'vue'
import ChatWindowCE from './lib/ChatWindowCE.vue'

export const VueAdvancedChat = defineCustomElement(ChatWindowCE)

const PACKAGE_NAME = 'vue-advanced-chat'

export function register() {
	if (!customElements.get(PACKAGE_NAME)) {
		customElements.define(PACKAGE_NAME, VueAdvancedChat)
	}
}

export type * from './types'
