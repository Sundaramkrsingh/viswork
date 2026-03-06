import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// DELETE THIS ROUTE after debugging auth
export async function GET() {
  try {
    const [users, sessions, accounts, tokens] = await Promise.all([
      prisma.user.findMany({ select: { id: true, email: true, emailVerified: true, createdAt: true } }),
      prisma.session.findMany({ select: { id: true, sessionToken: true, userId: true, expires: true } }),
      prisma.account.findMany({ select: { id: true, provider: true, userId: true } }),
      prisma.verificationToken.findMany({ select: { identifier: true, expires: true } }),
    ])
    return NextResponse.json({ users, sessions, accounts, tokens })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

// Wipe all auth tables to start fresh
export async function DELETE() {
  try {
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.verificationToken.deleteMany()
    await prisma.user.deleteMany()
    return NextResponse.json({ ok: true, message: 'All auth records deleted' })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
