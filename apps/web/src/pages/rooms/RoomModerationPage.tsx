import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useBanCreatorUser,
  useCreatorBans,
  useDeleteRoomMessage,
  useKickRoomUser,
  useMuteRoomUser,
  usePinRoomMessage,
  useRewardRoomUser,
  useRoomModerationActions,
  useUnbanCreatorUser,
  useUnmuteRoomUser,
  useUpdateRoomChatSettings,
} from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import { Ban, Gift, MessageSquareOff, Pin, Shield, Timer, UserMinus, Volume2, VolumeX } from 'lucide-react'

export function RoomModerationPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [targetUserId, setTargetUserId] = useState('')
  const [messageId, setMessageId] = useState('')
  const [reason, setReason] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('5')
  const [slowModeSeconds, setSlowModeSeconds] = useState('0')
  const actions = useRoomModerationActions(roomId!)
  const bans = useCreatorBans()

  const mute = useMuteRoomUser()
  const unmute = useUnmuteRoomUser()
  const kick = useKickRoomUser()
  const ban = useBanCreatorUser()
  const unban = useUnbanCreatorUser()
  const reward = useRewardRoomUser()
  const deleteMessage = useDeleteRoomMessage()
  const pinMessage = usePinRoomMessage()
  const updateChatSettings = useUpdateRoomChatSettings()

  const durationSeconds = Number(durationMinutes) > 0 ? Number(durationMinutes) * 60 : undefined

  async function run(label: string, fn: () => Promise<unknown>) {
    try {
      await fn()
      toast.success(label)
    } catch (err) {
      toast.error((err as Error).message || 'Action failed')
    }
  }

  const targetPayload = { roomId: roomId!, targetUserId, reason: reason || undefined, durationSeconds }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Streamer Controls</h1>
        <p className="text-sm text-muted-foreground">Moderate chat and reward viewers in this room.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
            <label className="space-y-1.5 text-sm font-medium">
              Target User ID
              <Input value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Minutes
              <Input value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
            </label>
          </div>
          <label className="space-y-1.5 text-sm font-medium block">
            Reason
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!targetUserId} loading={mute.isPending} onClick={() => run('Viewer muted', () => mute.mutateAsync(targetPayload))}>
              <VolumeX className="h-4 w-4" /> Mute
            </Button>
            <Button size="sm" variant="outline" disabled={!targetUserId} loading={unmute.isPending} onClick={() => run('Viewer unmuted', () => unmute.mutateAsync({ roomId: roomId!, targetUserId, reason: reason || undefined }))}>
              <Volume2 className="h-4 w-4" /> Unmute
            </Button>
            <Button size="sm" variant="outline" disabled={!targetUserId} loading={kick.isPending} onClick={() => run('Viewer kicked', () => kick.mutateAsync(targetPayload))}>
              <UserMinus className="h-4 w-4" /> Kick
            </Button>
            <Button size="sm" variant="destructive" disabled={!targetUserId} loading={ban.isPending} onClick={() => run('Viewer banned', () => ban.mutateAsync(targetPayload))}>
              <Ban className="h-4 w-4" /> Ban
            </Button>
            <Button size="sm" variant="outline" disabled={!targetUserId} loading={unban.isPending} onClick={() => run('Viewer unbanned', () => unban.mutateAsync({ roomId: roomId!, targetUserId, reason: reason || undefined }))}>
              <Shield className="h-4 w-4" /> Unban
            </Button>
            <Button size="sm" variant="outline" disabled={!targetUserId} loading={reward.isPending} onClick={() => run('Viewer rewarded', () => reward.mutateAsync({ roomId: roomId!, targetUserId, type: 'SHOUTOUT', note: reason || undefined }))}>
              <Gift className="h-4 w-4" /> Shoutout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              Message ID
              <Input value={messageId} onChange={(event) => setMessageId(event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Slow Mode Seconds
              <Input value={slowModeSeconds} onChange={(event) => setSlowModeSeconds(event.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" disabled={!messageId} loading={deleteMessage.isPending} onClick={() => run('Message deleted', () => deleteMessage.mutateAsync({ roomId: roomId!, messageId }))}>
              <MessageSquareOff className="h-4 w-4" /> Delete Message
            </Button>
            <Button size="sm" variant="outline" disabled={!messageId} loading={pinMessage.isPending} onClick={() => run('Message pinned', () => pinMessage.mutateAsync({ roomId: roomId!, messageId }))}>
              <Pin className="h-4 w-4" /> Pin Message
            </Button>
            <Button size="sm" variant="outline" loading={updateChatSettings.isPending} onClick={() => run('Chat settings updated', () => updateChatSettings.mutateAsync({ roomId: roomId!, slowModeSeconds: Number(slowModeSeconds) || 0 }))}>
              <Timer className="h-4 w-4" /> Set Slow Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <h2 className="text-sm font-medium uppercase text-muted-foreground">Recent Actions</h2>
            {actions.isLoading ? (
              <Skeleton className="mt-3 h-24 w-full" />
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                {(((actions.data as any)?.data ?? []) as any[]).map((action) => (
                  <div key={action.id} className="rounded border border-border px-3 py-2">
                    <div className="font-medium">{action.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.targetUserId ?? action.targetMessageId ?? 'room'} · {new Date(action.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <h2 className="text-sm font-medium uppercase text-muted-foreground">Creator Bans</h2>
            {bans.isLoading ? (
              <Skeleton className="mt-3 h-24 w-full" />
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                {(((bans.data as any)?.data ?? []) as any[]).map((item) => (
                  <div key={item.id} className="rounded border border-border px-3 py-2">
                    <div className="font-medium">{item.userId}</div>
                    <div className="text-xs text-muted-foreground">{item.reason ?? 'No reason provided'}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
