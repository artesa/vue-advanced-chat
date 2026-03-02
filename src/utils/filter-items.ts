export default <T extends Record<string, any>>(items: T[], prop: keyof T, val: string, startsWith = false): T[] => {
	if (!val || val === '')
		return items

	return items.filter((v) => {
		if (startsWith)
			return formatString(v[prop]).startsWith(formatString(val))
		return formatString(v[prop]).includes(formatString(val))
	})
}

function formatString(string: string): string {
	return string
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036F]/g, '')
}
