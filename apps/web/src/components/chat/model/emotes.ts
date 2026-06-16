import { CHAT_EMOTES } from '../composer/emotes'

export const LOUNGE_EMOTES = [
  '🌶️', '💋', '🎁', '⭐', '💎', '🔥', '💜', '🫦', '✨', '🎀',
] as const

export function mergeEmotes(customEmotes: readonly string[] = []) {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const emote of [...CHAT_EMOTES, ...LOUNGE_EMOTES, ...customEmotes]) {
    if (seen.has(emote)) continue
    seen.add(emote)
    merged.push(emote)
  }

  return merged
}
