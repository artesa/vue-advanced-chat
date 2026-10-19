import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: tag => tag === 'emoji-picker',
				},
			},
		}),
	],
	publicDir: resolve(__dirname, 'demo/samples'),
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	test: {
		browser: {
			enabled: true,
			// a visible browser window changes the size of the screenshots
			headless: true,
			provider: playwright(),
			instances: [{ browser: 'chromium' }],
		},
		include: ['e2e/**/*.spec.ts'],
	},
})
