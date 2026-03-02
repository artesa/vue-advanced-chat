import antfu from '@antfu/eslint-config'

export default antfu({
	vue: true,
	typescript: true,
	stylistic: {
		indent: 'tab'
	},
	rules: {
		'vue/custom-event-name-casing': ['warn', 'kebab-case']
	}
})
