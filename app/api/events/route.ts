import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { registerConnection, removeConnection } from '@/lib/sse/broadcaster'

export const dynamic = 'force-dynamic'

export async function GET() {
  const workspace = await getOrCreateDefaultWorkspace()
  const workspaceId = workspace.id

  let connectionId: string

  const stream = new ReadableStream({
    start(controller) {
      connectionId = registerConnection(workspaceId, controller)

      // Send initial heartbeat so the client knows it's connected
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'))

      // Keep-alive ping every 25 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(interval)
        }
      }, 25_000)
    },
    cancel() {
      removeConnection(connectionId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}