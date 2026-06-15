import { Navigate, useParams } from 'react-router-dom'

export function RoomMessagesPage() {
  const { roomId } = useParams<{ roomId: string }>()
  return <Navigate to={`/rooms/${roomId}`} replace />
}
