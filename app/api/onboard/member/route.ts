import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Already onboarded
  if (session.user.memberId) {
    return NextResponse.json({ ok: true })
  }

  try {
    const { name, expertiseRoles } = await req.json() as {
      name?: string
      expertiseRoles?: string[]
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!expertiseRoles?.length) {
      return NextResponse.json({ error: 'At least one expertise role is required' }, { status: 400 })
    }

    // Get the single workspace
    const workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found. Create one first.' }, { status: 400 })
    }

    // Check if there's an existing TeamMember with this email (invited before they logged in)
    const existing = await prisma.teamMember.findUnique({
      where: { email: session.user.email! },
    })

    if (existing) {
      // Link the auth user to the existing member record
      await prisma.teamMember.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          expertiseRoles,
          userId: session.user.id,
        },
      })
    } else {
      // Create a fresh member
      await prisma.teamMember.create({
        data: {
          name: name.trim(),
          email: session.user.email!,
          expertiseRoles,
          userId: session.user.id,
          workspaceId: workspace.id,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/onboard/member]', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}
