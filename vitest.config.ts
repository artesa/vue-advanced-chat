import { resolve } from 'node:path'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	publicDir: resolve(__dirname, 'demo/samples'),
	test: {
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [
				{ browser: 'chromium' },
			],
		},
		include: ['e2e/**/*.spec.ts'],
	},
})
