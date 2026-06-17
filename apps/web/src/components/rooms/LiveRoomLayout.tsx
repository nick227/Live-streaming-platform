import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function LiveRoomLayout({
  header,
  video,
  controls,
  children,
  chat,
  sideRailFooter,
  mobileSideRailFooter,
  className,
}: {
  header?: ReactNode
  video: ReactNode
  controls?: ReactNode
  children?: ReactNode
  chat: ReactNode | (() => ReactNode)
  sideRailFooter?: ReactNode
  mobileSideRailFooter?: ReactNode
  className?: string
}) {
  const mobileFooter = mobileSideRailFooter ?? sideRailFooter
  const renderChat = () => (typeof chat === 'function' ? chat() : chat)

  return (
    <>
      <main className={cn('mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4', className)}>
        {header}
        <section className="flex flex-col gap-4 broadcast-section">
          {video}
          {controls}
          {children}
        </section>
        <section className="flex flex-col gap-4 lg:hidden">
          <div className="flex min-h-[420px] flex-1 flex-col">{renderChat()}</div>
          {mobileFooter}
        </section>
      </main>

      <aside className="fixed right-0 top-14 z-10 hidden h-[calc(100vh-3.5rem)] w-[360px] flex-col border-l border-border bg-background lg:flex xl:w-[400px]">
        <div className="flex min-h-0 flex-1 flex-col p-3">{renderChat()}</div>
        {sideRailFooter}
      </aside>
    </>
  )
}
