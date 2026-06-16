// Widgets
export { ViewerChatPanel } from './widgets/ViewerChatPanel'
export { CreatorStudioChat } from './widgets/CreatorStudioChat'

// Hooks
export { useRoomSocket } from './hooks/useRoomSocket'
export type { RoomSocketCallbacks } from './socket/types'

// Types
export type { ChatMessageDto, RoomEvent } from './model/types'
export type { EventFilter } from './model/eventFilter'
export { userLabel } from './model/display'

// Moderation (used outside chat widget on GoLivePage)
export { ModerationActionBar } from './moderation/ModerationActionBar'
export type { UserAction } from './moderation/types'

// Backward-compatible aliases (remove in a follow-up)
export { ViewerChatPanel as RoomChatPanel } from './widgets/ViewerChatPanel'
export { CreatorStudioChat as CreatorEventLog } from './widgets/CreatorStudioChat'
export { ModerationActionBar as ModerationButtons } from './moderation/ModerationActionBar'
