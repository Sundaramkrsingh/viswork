import { NextResponse } from 'next/server'
import { getMission } from '@/lib/db/mission'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const mission = await getMission(id)
    if (!mission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(mission)
  } catch (error) {
    console.error('[GET /api/missions/[id]]', error)
    return NextResponse.json({ error: 'Failed to load mission' }, { status: 500 })
  }
}
