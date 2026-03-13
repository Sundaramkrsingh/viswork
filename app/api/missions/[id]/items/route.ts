import { NextResponse } from 'next/server'
import { addMissionItem } from '@/lib/db/mission'
import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { broadcast } from '@/lib/sse/broadcaster'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json() as { taskId?: string; targetText?: string }

    if (!body.taskId && !body.targetText) {
      return NextResponse.json({ error: 'Provide taskId or targetText' }, { status: 400 })
    }

    const item = await addMissionItem(id, {
      taskId: body.taskId,
      targetText: body.targetText,
    })
    const workspace = await getOrCreateDefaultWorkspace()
    broadcast(workspace.id, 'missions')

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/missions/[id]/items]', error)
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }
}
