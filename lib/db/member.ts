import { prisma } from './prisma'
import type { TeamMember, TeamMemberWithTask, AvailabilityStatus, TaskType } from '@/lib/types'

function toClientMember(m: {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  expertiseRoles: string[]
  availability: string
  flowStateEndsAt: Date | null
  workspaceId: string
  createdAt: Date
  updatedAt: Date
}): TeamMember {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    avatarUrl: m.avatarUrl,
    expertiseRoles: m.expertiseRoles,
    availability: m.availability as AvailabilityStatus,
    flowStateEndsAt: m.flowStateEndsAt,
    workspaceId: m.workspaceId,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }
}

export async function getTeamMembersWithTasks(workspaceId: string): Promise<TeamMemberWithTask[]> {
  const members = await prisma.teamMember.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    include: {
      assignedTasks: {
        where: { status: { in: ['in_progress', 'in_review'] } },
        select: { id: true, title: true, type: true },
        take: 1,
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  return members.map((m) => ({
    ...toClientMember(m),
    currentTask: m.assignedTasks[0]
      ? {
          id: m.assignedTasks[0].id,
          title: m.assignedTasks[0].title,
          type: m.assignedTasks[0].type as TaskType,
        }
      : null,
  }))
}

export async function updateMemberAvailability(
  id: string,
  data: { availability: AvailabilityStatus; flowStateEndsAt?: Date | null }
): Promise<TeamMember> {
  const updated = await prisma.teamMember.update({
    where: { id },
    data: {
      availability: data.availability,
      flowStateEndsAt: data.flowStateEndsAt ?? null,
      updatedAt: new Date(),
    },
  })
  return toClientMember(updated)
}
