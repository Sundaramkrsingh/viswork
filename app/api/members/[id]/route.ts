import { NextRequest, NextResponse } from 'next/server'
import { updateMemberAvailability } from '@/lib/db/member'
import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { broadcast } from '@/lib/sse/broadcaster'
import type { AvailabilityStatus } from '@/lib/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      availability: AvailabilityStatus
      flowStateEndsAt?: string | null
    }

    const member = await updateMemberAvailability(id, {
      availability: body.availability,
      flowStateEndsAt: body.flowStateEndsAt ? new Date(body.flowStateEndsAt) : null,
    })

    const workspace = await getOrCreateDefaultWorkspace()
    broadcast(workspace.id, 'team')

    return NextResponse.json(member)
  } catch (error) {
    console.error('[PATCH /api/members/[id]]', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}
