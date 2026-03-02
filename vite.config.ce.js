import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
		vue({ features: { customElement: true } }),
		dts({ tsconfigPath: './tsconfig.json' })
	],
	build: {
		outDir: 'dist/ce',
		lib: {
			entry: resolve(__dirname, 'src/index.ce.ts'),
			name: 'vue-advanced-chat',
			formats: ['es'],
			fileName: 'vue-advanced-chat',
			cssFileName: 'style'
		},
		rollupOptions: {
			external: [/^vue/, /^@vueuse/, /^emoji-picker-element/, /^micromark/]
		}
	},
	resolve: {
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
		alias: {
			'@': resolve(__dirname, './src')
		}
	}
})
