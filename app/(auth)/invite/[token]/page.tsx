import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import InviteAccept from './InviteAccept'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { workspace: true, invitedBy: true },
  })

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return notFound()
  }

  return (
    <InviteAccept
      token={token}
      email={invite.email}
      workspaceName={invite.workspace.name}
      invitedBy={invite.invitedBy.name}
    />
  )
}
