export type QuickChatMessage = {
  label: string
  body: string
}

export type BuiltInGif = {
  label: string
  token: string
  title: string
}

export const COMMON_QUICK_MESSAGES: QuickChatMessage[] = [
  { label: 'Hello', body: 'Hey everyone!' },
  { label: 'Thanks', body: 'Thank you!' },
  { label: 'Hype', body: 'Let’s go 🔥' },
]

export const VIEWER_QUICK_MESSAGES: QuickChatMessage[] = [
  ...COMMON_QUICK_MESSAGES,
  { label: 'Amazing', body: 'This is amazing ❤️' },
  { label: 'Request', body: 'Can we get one more?' },
]

export const BROADCASTER_QUICK_MESSAGES: QuickChatMessage[] = [
  { label: 'Welcome', body: 'Welcome in, everyone!' },
  { label: 'Goal', body: 'We’re getting close to the goal.' },
  { label: 'Private', body: 'Private requests are open if you want one-on-one time.' },
  { label: 'BRB', body: 'Quick pause — I’ll be right back.' },
]

export const BUILT_IN_GIFS: BuiltInGif[] = [
  { label: 'Hype', token: '[gif:hype]', title: 'HYPE' },
  { label: 'Goal', token: '[gif:goal]', title: 'GOAL' },
]

export const BUILT_IN_GIF_BY_TOKEN = new Map(BUILT_IN_GIFS.map((gif) => [gif.token, gif]))
