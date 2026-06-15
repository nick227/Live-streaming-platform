import { useParams } from 'react-router-dom'
import { useRoomMessages } from '@streamyolo/sdk'
import { DataStubCard } from '@/components/ui/DataStubCard'

export function RoomMessagesPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { data, isLoading } = useRoomMessages(roomId!)
  return <DataStubCard title="Room Messages" isLoading={isLoading} data={data?.data} />
}
