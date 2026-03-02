import type { RoomUser } from '@/types'
import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'
import { underline, underlineHtml } from './underline'
import { usertag, usertagHtml } from './usertag'

interface TextFormattingOptions {
	linkify?: boolean
	singleLine?: boolean
	users?: RoomUser[]
	[key: string]: unknown
}

interface MarkdownOptions {
	textFormatting?: TextFormattingOptions
}

interface MarkdownToken {
	types: string[]
	value: string
}

export default (text: string, { textFormatting }: MarkdownOptions): MarkdownToken[] => {
	if (textFormatting) {
		let gfmDisabled: string[] = []

		if (!textFormatting.linkify) {
			gfmDisabled = ['literalAutolink', 'literalAutolinkEmail']
		}

		const markdown = micromark(
			text.replaceAll('<usertag>', '<@').replaceAll('</usertag>', '>'),
			{
				extensions: [
					{
						...gfm(),
						disable: { null: gfmDisabled },
					},
					underline,
					usertag,
				],
				htmlExtensions: [
					gfmHtml(),
					underlineHtml,
					usertagHtml(textFormatting.users || []),
				],
			} as any,
		)

		if (textFormatting.singleLine) {
			const element = document.createElement('div')

			element.innerHTML = markdown

			return [
				{
					types: [],
					value: element.textContent,
				},
			]
		}

		return [
			{
				types: ['markdown'],
				value: markdown,
			},
		]
	}

	return [
		{
			types: [],
			value: text,
		},
	]
}
