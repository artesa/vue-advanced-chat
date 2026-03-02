import type { I18n, Room } from '@/types'

export default (room: Room, currentUserId: string, i18n: I18n): string | undefined => {
	if (room.typingUsers && room.typingUsers.length) {
		const typingUsers = room.users.filter((user) => {
			if (user._id === currentUserId)
				return false
			if (!room.typingUsers!.includes(user._id))
				return false
			if (user.status && user.status.state === 'offline')
				return false
			return true
		})

		if (!typingUsers.length)
			return

		if (room.users.length === 2) {
			return i18n.isTyping
		}
		else {
			return (
				`${typingUsers.map(user => user.username).join(', ')
				} ${
					i18n.isTyping}`
			)
		}
	}
}
