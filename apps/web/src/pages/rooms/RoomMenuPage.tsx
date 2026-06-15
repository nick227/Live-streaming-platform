import { useParams } from 'react-router-dom'
import { useRoomMenu } from '@streamyolo/sdk'
import { DataStubCard } from '@/components/ui/DataStubCard'

export function RoomMenuPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { data, isLoading } = useRoomMenu(roomId!)
  return <DataStubCard title="Room Menu" isLoading={isLoading} data={data?.data} />
}
