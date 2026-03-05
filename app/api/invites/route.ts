import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { sendInvite } from '@/lib/email'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email } = await req.json() as { email?: string }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Already a member?
    const existing = await prisma.teamMember.findUnique({
      where: { email: normalizedEmail },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already a team member' }, { status: 409 })
    }

    // Already a pending (unused, unexpired) invite?
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent' }, { status: 409 })
    }

    const workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const invite = await prisma.invite.create({
      data: {
        email: normalizedEmail,
        workspaceId: workspace.id,
        invitedById: session.user.memberId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    const invitedBy = await prisma.teamMember.findUnique({
      where: { id: session.user.memberId },
      select: { name: true },
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invite.token}`

    await sendInvite({
      to: normalizedEmail,
      inviteUrl,
      invitedBy: invitedBy?.name ?? 'A teammate',
      workspaceName: workspace.name,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/invites]', error)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}
