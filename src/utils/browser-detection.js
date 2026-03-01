let isChromium = window.chrome
let winNav = window.navigator
let vendorName = winNav.vendor
let isOpera = typeof window.opr !== 'undefined'
let isIEedge = winNav.userAgent.includes('Edg')
let isIOSChrome = winNav.userAgent.match('CriOS')

export function detectChrome() {
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
