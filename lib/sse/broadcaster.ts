export type SSEEvent =
  | 'stack'
  | 'team'
  | 'queries'
  | 'missions'
  | 'graveyard'

type Connection = {
  controller: ReadableStreamDefaultController
  workspaceId: string
}

// In-memory registry: connectionId → Connection
const connections = new Map<string, Connection>()
let nextId = 0

export function registerConnection(
  workspaceId: string,
  controller: ReadableStreamDefaultController
): string {
  const id = String(nextId++)
  connections.set(id, { controller, workspaceId })
  return id
}

export function removeConnection(id: string) {
  connections.delete(id)
}

export function broadcast(workspaceId: string, event: SSEEvent) {
  const data = `event: ${event}\ndata: {}\n\n`
  const encoder = new TextEncoder()
  const dead: string[] = []

  for (const [id, conn] of connections.entries()) {
    if (conn.workspaceId !== workspaceId) continue
    try {
      conn.controller.enqueue(encoder.encode(data))
    } catch {
      dead.push(id)
    }
  }

  for (const id of dead) connections.delete(id)
}