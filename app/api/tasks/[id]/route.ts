import { NextResponse } from 'next/server'
import { getTask, assignTask, updateTaskStatus } from '@/lib/db/task'
import type { Task } from '@/lib/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const task = await getTask(id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (error) {
    console.error('[GET /api/tasks/[id]]', error)
    return NextResponse.json({ error: 'Failed to load task' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json() as { assigneeId?: string; status?: Task['status'] }

    let task
    if (body.assigneeId) {
      task = await assignTask(id, body.assigneeId)
    } else if (body.status) {
      task = await updateTaskStatus(id, body.status)
    } else {
      return NextResponse.json({ error: 'Provide assigneeId or status' }, { status: 400 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('[PATCH /api/tasks/[id]]', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
