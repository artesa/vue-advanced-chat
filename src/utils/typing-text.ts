import type { Room, TextMessages } from '@/types'

export default (room: Room, currentUserId: string, textMessages: TextMessages): string | undefined => {
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
			return textMessages.IS_TYPING
		}
		else {
			return (
				`${typingUsers.map(user => user.username).join(', ')
				} ${
					textMessages.IS_TYPING}`
			)
		}
	}
}
