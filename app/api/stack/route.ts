import { NextResponse } from 'next/server'
import { getStack, getOrCreateDefaultWorkspace } from '@/lib/db/stack'

export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace()
    const stack = await getStack(workspace.id)
    return NextResponse.json(stack)
  } catch (error) {
    console.error('[/api/stack]', error)
    return NextResponse.json({ error: 'Failed to load stack' }, { status: 500 })
  }
}
