import { NextResponse } from 'next/server'
import { toggleMissionItem } from '@/lib/db/mission'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params
  try {
    const result = await toggleMissionItem(itemId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[PATCH /api/missions/[id]/items/[itemId]]', error)
    return NextResponse.json({ error: 'Failed to toggle item' }, { status: 500 })
  }
}
