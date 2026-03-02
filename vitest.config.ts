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
			provider: playwright(),
			instances: [{ browser: 'chromium' }],
		},
		include: ['e2e/**/*.spec.ts'],
	},
})
