import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const invite = await prisma.invite.findUnique({ where: { token } })
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
    }

    await prisma.invite.update({
      where: { token },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/invites/[token]/use]', error)
    return NextResponse.json({ error: 'Failed to process invite' }, { status: 500 })
  }
}
