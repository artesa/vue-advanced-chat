const isChromium: unknown = window.chrome
const winNav: Navigator = window.navigator
const vendorName: string = winNav.vendor
const isOpera: boolean = typeof window.opr !== 'undefined'
const isIEedge: boolean = winNav.userAgent.includes('Edg')
const isIOSChrome: RegExpMatchArray | null = winNav.userAgent.match('CriOS')

export function detectChrome(): boolean {
	if (isIOSChrome) {
		return true
	}
	else if (
		isChromium !== null
		&& typeof isChromium !== 'undefined'
		&& vendorName === 'Google Inc.'
		&& isOpera === false
		&& isIEedge === false
	) {
		return true
	}
	else {
		return false
	}
}
