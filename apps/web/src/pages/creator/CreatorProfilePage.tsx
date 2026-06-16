import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useCurrentUser,
  useCreatorProfile,
  useUpdateCreatorProfile,
  useUploadMedia,
  useLogout,
} from '@streamyolo/sdk'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ProfileWalletCard } from '@/components/profile/ProfileWalletCard'
import { ProfileSettingsForm } from '@/components/profile/ProfileSettingsForm'
import type { ProfileFormData } from '@/components/profile/ProfileSettingsForm'
import { ProfileStreamHistory } from '@/components/profile/ProfileStreamHistory'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { toggleTheme } from '@/lib/theme'
import { toast } from 'sonner'
import {
  Camera,
  LogOut,
  Moon,
  Radio,
  Shield,
  ShieldCheck,
  Sun,
  Coins,
  List,
} from 'lucide-react'

export function CreatorProfilePage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: meData, isLoading: meLoading } = useCurrentUser()
  const { data: profileData, isLoading: profileLoading } = useCreatorProfile()
  const updateProfile = useUpdateCreatorProfile()
  const uploadMedia = useUploadMedia()
  const logout = useLogout()

  const isLoading = meLoading || profileLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const user = meData?.data?.user
  const profile = profileData?.data
  const displayName = user?.displayName ?? profile?.displayName ?? 'User'
  const avatarSrc = resolveMediaUrl(profile?.avatarUrl)

  const formDefaults: ProfileFormData = {
    displayName: user?.displayName ?? '',
    bio: profile?.bio ?? '',
    privateRateTokensPerMinute: String(profile?.privateRateTokensPerMinute || 6),
    minPrivateMinutes: String(profile?.minPrivateMinutes || 1),
    privateViewerCamRequired: profile?.privateViewerCamRequired ? 'true' : 'false',
    privateScreenShareAllowed: profile?.privateScreenShareAllowed ? 'true' : 'false',
    privateRulesText: profile?.privateRulesText ?? '',
  }

  async function handleAvatarChange(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'AVATAR')
    try {
      const result = await uploadMedia.mutateAsync(fd) as { data?: { id?: string } }
      const mediaId = result.data?.id
      if (!mediaId) throw new Error('No media id')
      await updateProfile.mutateAsync({ avatarMediaId: mediaId })
      toast.success('Avatar updated')
    } catch {
      toast.error('Avatar upload failed')
    }
  }

  async function handleLogout() {
    await logout.mutateAsync(undefined)
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative group shrink-0"
          disabled={uploadMedia.isPending || updateProfile.isPending}
        >
          <Avatar src={avatarSrc} name={displayName} size="xl" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleAvatarChange(file)
            e.target.value = ''
          }}
        />
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
            {profile?.status && <StatusBadge status={profile.status} />}
            {profile?.isLive && <StatusBadge status="LIVE" />}
          </div>
        </div>
      </div>

      {/* Wallet */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Wallet</h2>
        <ProfileWalletCard />
      </section>

      {/* Creator settings */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Creator Settings</h2>
        <ProfileSettingsForm defaults={formDefaults} />
      </section>

      {/* Stream history */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Stream History</h2>
        <ProfileStreamHistory />
      </section>

      {/* Actions */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Account</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/creator/rooms">
              <Radio className="h-4 w-4 mr-1.5" />
              My Rooms
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/creator/rooms/prepare">
              <Radio className="h-4 w-4 mr-1.5" />
              New Room
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/creator/menu-items">
              <List className="h-4 w-4 mr-1.5" />
              Tip Menu
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/creator/earnings">
              <Coins className="h-4 w-4 mr-1.5" />
              Earnings
            </Link>
          </Button>
          {profile?.currentRoomId && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/creator/rooms/${profile.currentRoomId}/moderation`}>
                <Shield className="h-4 w-4 mr-1.5" />
                Streamer Controls
              </Link>
            </Button>
          )}
          {user?.role === 'ADMIN' && (
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/overview">
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Admin
              </Link>
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
            <Sun className="h-4 w-4 mr-1.5 dark:hidden" />
            <Moon className="h-4 w-4 mr-1.5 hidden dark:block" />
            Toggle Theme
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleLogout} loading={logout.isPending}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Log Out
          </Button>
        </div>
      </section>
    </div>
  )
}
