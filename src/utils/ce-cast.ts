/**
 * Cast helpers for Custom Element (CE) compatibility.
 * When used as a CE, HTML attributes arrive as strings — these functions
 * convert them back to their intended types.
 */

export function castBoolean(val: boolean | string | undefined): boolean {
	return val === 'true' || val === true
}

export function castArray<T>(val: T[] | string | undefined): T[] {
	if (!val)
		return []
	return Array.isArray(val) ? val : JSON.parse(val as string)
}

export function castObject<T>(val: T | string | undefined): T {
	if (!val)
		return {} as T
	return typeof val === 'object' ? val : JSON.parse(val as string)
}
