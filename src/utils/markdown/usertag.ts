import type { RoomUser } from '@/types'
import { codes } from './constants'

function usertagTokenize(effects: any, ok: any, nok: any) {
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

		if (code === codes.greaterThan) {
			effects.exit('usertagContent')
			effects.enter('usertagMarker')
			effects.consume(code)
			effects.exit('usertagMarker')
			effects.exit('usertag')

			return ok
		}

		effects.consume(code)

		return inside
	}

	const insideEscape = (code: number | null): any => {
		if (code === codes.backslash || code === codes.greaterThan) {
			effects.consume(code)

			return inside
		}

		return inside(code)
	}

	const begin = (code: number | null): any => {
		if (code === codes.atSign) {
			effects.consume(code)
			effects.exit('usertagMarker')
			effects.enter('usertagContent')

			return inside
		}

		return nok(code)
	}

	return (code: number | null): any => {
		effects.enter('usertag')
		effects.enter('usertagMarker')
		effects.consume(code)

		return begin
	}
}

const usertagConstruct = { name: 'usertag', tokenize: usertagTokenize }

export const usertag = { text: { 60: usertagConstruct } } // 60 is the less than sign

export function usertagHtml(users: RoomUser[]) {
	return {
		exit: {
			usertagContent(this: any, token: any) {
				const userId = this.sliceSerialize(token)

				this.tag(`<span class="vac-text-tag" data-user-id="${userId}">`)

				const user = users.find((user: RoomUser) => user._id === userId)

				this.raw(`@${this.encode(user ? user.username : userId)}`)

				this.tag('</span>')
			},
		},
	}
}
