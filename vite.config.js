import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
	plugins: [vue({ features: { customElement: true } })],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/lib/index.js'),
			name: 'vue-advanced-chat',
			formats: ['es'],
			fileName: 'vue-advanced-chat',
			cssFileName: 'style'
		},
		rollupOptions: {
			external: [/^vue/, /^@vueuse/, /^emoji-picker-element/, /^micromark/],
		}
	},
	resolve: {
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
		alias: {
			'@': resolve(__dirname, './src')
		}
	}
})
