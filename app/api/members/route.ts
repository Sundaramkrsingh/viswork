import { NextResponse } from 'next/server'
import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { getTeamMembers } from '@/lib/db/task'

export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace()
    const members = await getTeamMembers(workspace.id)
    return NextResponse.json(members)
  } catch (error) {
    console.error('[GET /api/members]', error)
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 })
  }
}
