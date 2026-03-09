import type { Message, Room, RoomUser } from '@/types'

export const currentUserId = 'user-1'

export const users: RoomUser[] = [
	{
		_id: 'user-1',
		username: 'Luke',
		avatar: '',
		status: { state: 'online', lastChanged: 'Today, 14:30' },
	},
	{
		_id: 'user-2',
		username: 'Leia',
		avatar: '',
		status: { state: 'online', lastChanged: 'Today, 14:25' },
	},
	{
		_id: 'user-3',
		username: 'Yoda',
		avatar: '',
		status: { state: 'offline', lastChanged: '14 Feb 2026' },
	},
]

export const rooms: Room[] = [
	{
		roomId: 'room-1',
		roomName: 'Leia',
		avatar: '',
		users: [users[0], users[1]],
		unreadCount: 2,
		lastMessage: {
			_id: 'msg-5',
			content: "Sounds like a plan! I'll bring Han.",
			senderId: 'user-1',
			timestamp: '10:20',
			saved: true,
			distributed: true,
			seen: true,
		},
	},
	{
		roomId: 'room-2',
		roomName: 'Yoda',
		avatar: '',
		users: [users[0], users[2]],
		lastMessage: {
			_id: 'msg-2-4',
			content: 'Understood. The Force is strong today.',
			senderId: 'user-1',
			timestamp: '08:30',
			saved: true,
		},
	},
	{
		roomId: 'room-3',
		roomName: 'Group Chat',
		avatar: '',
		users: [users[0], users[1], users[2]],
		lastMessage: {
			_id: 'msg-3-2',
			content: "I'll prepare the intel briefing.",
			senderId: 'user-2',
			timestamp: '09:15',
		},
	},
]

export const messages: Message[] = [
	{
		_id: 'msg-1',
		senderId: 'user-1',
		content: 'Hey Leia, how are you?',
		username: 'Luke',
		date: '28 Feb 2026',
		timestamp: '10:00',
		saved: true,
		distributed: true,
		seen: true,
	},
	{
		_id: 'msg-2',
		senderId: 'user-2',
		content: "I'm good! Just got back from the Senate.",
		username: 'Leia',
		date: '28 Feb 2026',
		timestamp: '10:05',
		saved: true,
		distributed: true,
		seen: true,
	},
	{
		_id: 'msg-3',
		senderId: 'user-1',
		content: 'Nice! We should meet up soon.',
		username: 'Luke',
		date: '28 Feb 2026',
		timestamp: '10:10',
		saved: true,
		distributed: true,
		seen: true,
		reactions: {
			'👍': ['user-2'],
		},
	},
	{
		_id: 'msg-4',
		senderId: 'user-2',
		content: 'Absolutely! How about tomorrow at the cantina?',
		username: 'Leia',
		date: '28 Feb 2026',
		timestamp: '10:15',
		saved: true,
	},
	{
		_id: 'msg-5',
		senderId: 'user-1',
		content: "Sounds like a plan! I'll bring Han.",
		username: 'Luke',
		date: '28 Feb 2026',
		timestamp: '10:20',
		saved: true,
		distributed: true,
		seen: true,
		replyMessage: {
			_id: 'msg-4',
			content: 'Absolutely! How about tomorrow at the cantina?',
			senderId: 'user-2',
		},
	},
	{
		_id: 'msg-6',
		senderId: 'user-2',
		content: 'This message was edited.',
		username: 'Leia',
		date: '28 Feb 2026',
		timestamp: '10:25',
		edited: true,
		saved: true,
	},
	{
		_id: 'msg-7',
		senderId: 'user-2',
		content: '',
		username: 'Leia',
		date: '28 Feb 2026',
		timestamp: '10:30',
		deleted: true,
		saved: true,
	},
]

export const audioMessage: Message = {
	_id: 'msg-audio',
	senderId: 'user-2',
	content: '',
	username: 'Leia',
	date: '28 Feb 2026',
	timestamp: '10:35',
	saved: true,
	files: [
		{
			name: 'audio.mp3',
			type: 'audio/mpeg',
			extension: 'mp3',
			url: '/sample.mp3',
			audio: true,
			duration: 1,
		},
	],
}

export const imageMessage: Message = {
	_id: 'msg-image',
	senderId: 'user-2',
	content: 'Check out these plans!',
	username: 'Leia',
	date: '28 Feb 2026',
	timestamp: '10:40',
	saved: true,
	files: [
		{
			name: 'death-star-plans.png',
			type: 'image/png',
			extension: 'png',
			url: '/sample.png',
		},
	],
}

export const uploadingImageMessage: Message = {
	_id: 'msg-upload',
	senderId: 'user-1',
	content: 'Uploading a photo...',
	username: 'Luke',
	date: '28 Feb 2026',
	timestamp: '10:50',
	saved: false,
	files: [
		{
			name: 'photo.png',
			type: 'image/png',
			extension: 'png',
			url: '/sample.png',
			progress: 65,
		},
	],
}

export const fileMessage: Message = {
	_id: 'msg-file',
	senderId: 'user-2',
	content: 'Here is the briefing document.',
	username: 'Leia',
	date: '28 Feb 2026',
	timestamp: '10:45',
	saved: true,
	files: [
		{
			name: 'mission-briefing.pdf',
			type: 'application/pdf',
			extension: 'pdf',
			url: '#',
			size: 245000,
		},
	],
}
