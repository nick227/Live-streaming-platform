import { Link } from 'react-router-dom'
import { useCurrentUser, useCreatorProfile } from '@streamyolo/sdk'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { resolveMediaUrl } from '@/lib/mediaUrl'

export function AuthWidget() {
  const { data: meData, isLoading: meLoading } = useCurrentUser()
  const { data: profileData } = useCreatorProfile()

  if (meLoading) {
    return <Skeleton className="h-9 w-28 rounded-full" />
  }

  const me = meData?.data
  if (!me?.user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/login">Sign In</Link>
      </Button>
    )
  }

  const profile = profileData?.data
  const displayName = me.user.displayName
  const avatarSrc = resolveMediaUrl(profile?.avatarUrl)

  return (
    <Link
      to="/creator/profile"
      className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent transition-colors"
    >
      <Avatar src={avatarSrc} name={displayName} size="sm" />
      <span className="text-sm font-medium max-w-[8rem] truncate hidden sm:inline">
        {displayName}
      </span>
    </Link>
  )
}
