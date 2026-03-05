import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await req.json() as { name?: string }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
    }

    // Only allow if no workspace exists yet (first-ever user)
    const count = await prisma.workspace.count()
    if (count > 0) {
      // Already have a workspace — just let them proceed to member onboard
      return NextResponse.json({ ok: true })
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug: `${slug}-${Date.now()}`,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/onboard/workspace]', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}
