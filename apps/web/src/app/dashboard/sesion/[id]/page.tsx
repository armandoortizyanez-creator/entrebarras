import { SessionLiveView } from './SessionLiveView'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SessionLiveView sessionId={id} />
}
