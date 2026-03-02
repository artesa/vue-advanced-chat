import { codes } from './constants'

function underlineTokenize(effects: any, ok: any, nok: any) {
	const inside = (code: number | null): any => {
		if (
			code === codes.carriageReturn
			|| code === codes.lineFeed
			|| code === codes.carriageReturnLineFeed
			|| code === codes.eof
		) {
			return nok(code)
		}

		if (code === codes.backslash) {
			effects.consume(code)

			// eslint-disable-next-line ts/no-use-before-define
			return insideEscape
		}

		if (code === codes.degree) {
			effects.exit('underlineContent')
			effects.enter('underlineMarker')
			effects.consume(code)
			effects.exit('underlineMarker')
			effects.exit('underline')

			return ok
		}

		effects.consume(code)

		return inside
	}

	const insideEscape = (code: number | null): any => {
		if (code === codes.backslash || code === codes.degree) {
			effects.consume(code)

			return inside
		}

		return inside(code)
	}

	const begin = (code: number | null): any => (code === codes.degree ? nok(code) : inside(code))

	return (code: number | null): any => {
		effects.enter('underline')
		effects.enter('underlineMarker')
		effects.consume(code)
		effects.exit('underlineMarker')
		effects.enter('underlineContent', { contentType: 'string' })

		return begin
	}
}

const underlineConstruct = { name: 'underline', tokenize: underlineTokenize }

export const underline = { text: { 176: underlineConstruct } } // 176 is the degree sign

export const underlineHtml = {
	enter: {
		underline(this: any) {
			this.tag('<u>')
		},
	},
	exit: {
		underline(this: any) {
			this.tag('</u>')
		},
	},
}
