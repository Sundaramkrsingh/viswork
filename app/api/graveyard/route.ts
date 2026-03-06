import { NextResponse } from 'next/server'
import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { getCancelledTasks } from '@/lib/db/task'

export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace()
    const tasks = await getCancelledTasks(workspace.id)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('[/api/graveyard]', error)
    return NextResponse.json({ error: 'Failed to load graveyard' }, { status: 500 })
  }
}
