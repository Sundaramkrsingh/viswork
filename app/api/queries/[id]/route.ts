import { NextResponse } from 'next/server'
import { resolveQuery } from '@/lib/db/query'
import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { broadcast } from '@/lib/sse/broadcaster'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const query = await resolveQuery(id)

    const workspace = await getOrCreateDefaultWorkspace()
    broadcast(workspace.id, 'queries')

    return NextResponse.json(query)
  } catch (error) {
    console.error('[/api/queries/[id]]', error)
    return NextResponse.json({ error: 'Failed to resolve query' }, { status: 500 })
  }
}
