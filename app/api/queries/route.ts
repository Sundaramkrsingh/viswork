import { NextResponse } from 'next/server'
import { getOrCreateDefaultWorkspace } from '@/lib/db/stack'
import { getOpenQueries } from '@/lib/db/query'

export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace()
    const queries = await getOpenQueries(workspace.id)
    return NextResponse.json(queries)
  } catch (error) {
    console.error('[/api/queries]', error)
    return NextResponse.json({ error: 'Failed to load queries' }, { status: 500 })
  }
}
