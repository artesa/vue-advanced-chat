export const users = [
  {
    _id: '6R0MijpK6M4AIrwaaCY2',
    username: 'Luke',
    avatar: 'https://66.media.tumblr.com/avatar_c6a8eae4303e_512.pnj',
    status: { state: 'online', lastChanged: 'Today, 14:30' },
  },
  {
    _id: 'SGmFnBZB4xxMv9V4CVlW',
    username: 'Leia',
    avatar:
      'https://media.glamour.com/photos/5695e9d716d0dc3747eea3ef/master/w_1600,c_limit/beauty-2015-12-princess-leia-1-main.jpg',
    status: { state: 'online', lastChanged: 'Today, 14:25' },
  },
  {
    _id: '6jMsIXUrBHBj7o2cRlau',
    username: 'Yoda',
    avatar:
      'https://vignette.wikia.nocookie.net/teamavatarone/images/4/45/Yoda.jpg/revision/latest?cb=20130224160049',
    status: { state: 'offline', lastChanged: '14 Feb 2026' },
  },
]

export const rooms = [
  {
    roomId: 'room-1',
    users: ['6R0MijpK6M4AIrwaaCY2', 'SGmFnBZB4xxMv9V4CVlW'],
    lastUpdated: Date.now(),
  },
  {
    roomId: 'room-2',
    users: ['6R0MijpK6M4AIrwaaCY2', '6jMsIXUrBHBj7o2cRlau'],
    lastUpdated: Date.now() - 60000,
  },
  {
    roomId: 'room-3',
    users: ['SGmFnBZB4xxMv9V4CVlW', '6jMsIXUrBHBj7o2cRlau'],
    lastUpdated: Date.now() - 120000,
  },
  {
    roomId: 'room-4',
    users: [
      '6R0MijpK6M4AIrwaaCY2',
      'SGmFnBZB4xxMv9V4CVlW',
      '6jMsIXUrBHBj7o2cRlau',
    ],
    lastUpdated: Date.now() - 180000,
  },
]

export const messagesByRoom = {
  'room-1': [
    {
      _id: 'msg-1-1',
      senderId: '6R0MijpK6M4AIrwaaCY2',
      content: 'Hey Leia, how are you?',
      timestamp: new Date(2026, 1, 28, 10, 0),
    },
    {
      _id: 'msg-1-2',
      senderId: 'SGmFnBZB4xxMv9V4CVlW',
      content: "I'm good! Just got back from the Senate.",
      timestamp: new Date(2026, 1, 28, 10, 5),
    },
    {
      _id: 'msg-1-3',
      senderId: '6R0MijpK6M4AIrwaaCY2',
      content: 'Nice! We should meet up soon.',
      timestamp: new Date(2026, 1, 28, 10, 10),
      reactions: { '👍': ['SGmFnBZB4xxMv9V4CVlW'] },
    },
    {
      _id: 'msg-1-4',
      senderId: 'SGmFnBZB4xxMv9V4CVlW',
      content: 'Absolutely! How about tomorrow at the cantina?',
      timestamp: new Date(2026, 1, 28, 10, 15),
    },
    {
      _id: 'msg-1-5',
      senderId: '6R0MijpK6M4AIrwaaCY2',
      content: "Sounds like a plan! I'll bring Han.",
      timestamp: new Date(2026, 1, 28, 10, 20),
      replyMessage: {
        _id: 'msg-1-4',
        content: 'Absolutely! How about tomorrow at the cantina?',
        senderId: 'SGmFnBZB4xxMv9V4CVlW',
      },
    },
  ],
  'room-2': [
    {
      _id: 'msg-2-1',
      senderId: '6jMsIXUrBHBj7o2cRlau',
      content: 'Young Skywalker, training you must continue.',
      timestamp: new Date(2026, 1, 27, 8, 0),
    },
    {
      _id: 'msg-2-2',
      senderId: '6R0MijpK6M4AIrwaaCY2',
      content: "Yes Master Yoda, I've been practicing every day.",
      timestamp: new Date(2026, 1, 27, 8, 15),
    },
    {
      _id: 'msg-2-3',
      senderId: '6jMsIXUrBHBj7o2cRlau',
      content: 'Do or do not, there is no try.',
      timestamp: new Date(2026, 1, 27, 8, 20),
      reactions: {
        '🔥': ['6R0MijpK6M4AIrwaaCY2'],
        '💯': ['6R0MijpK6M4AIrwaaCY2'],
      },
    },
    {
      _id: 'msg-2-4',
      senderId: '6R0MijpK6M4AIrwaaCY2',
      content: 'Understood. The Force is strong today.',
      timestamp: new Date(2026, 1, 27, 8, 30),
      edited: true,
    },
  ],
  'room-3': [
    {
      _id: 'msg-3-1',
      senderId: 'SGmFnBZB4xxMv9V4CVlW',
      content: 'Master Yoda, I need your counsel.',
      timestamp: new Date(2026, 1, 26, 16, 0),
    },
    {
      _id: 'msg-3-2',
      senderId: '6jMsIXUrBHBj7o2cRlau',
      content: 'Listen I will, Princess.',
      timestamp: new Date(2026, 1, 26, 16, 10),
    },
    {
      _id: 'msg-3-3',
      senderId: 'SGmFnBZB4xxMv9V4CVlW',
      content:
        "The Resistance needs more support. We're running low on supplies.",
      timestamp: new Date(2026, 1, 26, 16, 15),
    },
    {
      _id: 'msg-3-4',
      senderId: '6jMsIXUrBHBj7o2cRlau',
      content: 'Patience you must have. Allies will come.',
      timestamp: new Date(2026, 1, 26, 16, 25),
    },
  ],
  'room-4': [
    {
      _id: 'msg-4-1',
      senderId: '6R0MijpK6M4AIrwaaCY2',
      content: 'Hey everyone! Group meeting time.',
      timestamp: new Date(2026, 2, 1, 9, 0),
    },
    {
      _id: 'msg-4-2',
      senderId: 'SGmFnBZB4xxMv9V4CVlW',
      content: "I'm here! What's the agenda?",
      timestamp: new Date(2026, 2, 1, 9, 5),
    },
    {
      _id: 'msg-4-3',
      senderId: '6jMsIXUrBHBj7o2cRlau',
      content: 'Present I am. Proceed we shall.',
      timestamp: new Date(2026, 2, 1, 9, 7),
    },
    {
      _id: 'msg-4-4',
      senderId: '6R0MijpK6M4AIrwaaCY2',
      content:
        "We need to plan our next mission. The Empire won't wait forever.",
      timestamp: new Date(2026, 2, 1, 9, 10),
      reactions: {
        '⚔️': [
          'SGmFnBZB4xxMv9V4CVlW',
          '6jMsIXUrBHBj7o2cRlau',
        ],
      },
    },
    {
      _id: 'msg-4-5',
      senderId: 'SGmFnBZB4xxMv9V4CVlW',
      content: "Agreed. I'll prepare the intel briefing.",
      timestamp: new Date(2026, 2, 1, 9, 15),
      replyMessage: {
        _id: 'msg-4-4',
        content:
          "We need to plan our next mission. The Empire won't wait forever.",
        senderId: '6R0MijpK6M4AIrwaaCY2',
      },
    },
  ],
}
