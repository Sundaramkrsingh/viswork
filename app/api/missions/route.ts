import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { getMissions, createMission } from '@/lib/db/mission'
import type { MissionVisibility } from '@/lib/types'

export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace()
    const missions = await getMissions(workspace.id)
    return NextResponse.json(missions)
  } catch (error) {
    console.error('[GET /api/missions]', error)
    return NextResponse.json({ error: 'Failed to load missions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user.memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as {
      title: string
      description?: string
      visibility?: MissionVisibility
      deadline: string
    }

    if (!body.title || !body.deadline) {
      return NextResponse.json({ error: 'title and deadline are required' }, { status: 400 })
    }

    const workspace = await getOrCreateDefaultWorkspace()
    const mission = await createMission({
      title: body.title,
      description: body.description,
      visibility: body.visibility ?? 'team',
      deadline: new Date(body.deadline),
      workspaceId: workspace.id,
      creatorId: session.user.memberId,
    })

    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    console.error('[POST /api/missions]', error)
    return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 })
  }
}
