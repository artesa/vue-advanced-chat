import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: (tagName) => {
						return tagName === 'emoji-picker'
					},
				},
			},
		}),
	],
	resolve: {
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	server: {
		strictPort: false,
	},
	base: process.env.NODE_ENV === 'production' ? '/vue-advanced-chat/' : '/',
})
