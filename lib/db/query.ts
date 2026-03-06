import { prisma } from './prisma'
import type { Query, TeamMember, Task } from '@/lib/types'

export type QueryWithContext = Query & {
  raisedBy: TeamMember
  task: Pick<Task, 'id' | 'title' | 'type'>
}

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
    availability: m.availability as TeamMember['availability'],
    flowStateEndsAt: m.flowStateEndsAt,
    workspaceId: m.workspaceId,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }
}

export async function getOpenQueries(workspaceId: string): Promise<QueryWithContext[]> {
  const queries = await prisma.query.findMany({
    where: { workspaceId, resolved: false },
    include: {
      raisedBy: true,
      task: { select: { id: true, title: true, type: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return queries.map((q) => ({
    id: q.id,
    text: q.text,
    blocking: q.blocking,
    resolved: q.resolved,
    resolvedAt: q.resolvedAt,
    taskId: q.taskId,
    raisedById: q.raisedById,
    workspaceId: q.workspaceId,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    raisedBy: toClientMember(q.raisedBy),
    task: {
      id: q.task.id,
      title: q.task.title,
      type: q.task.type as Task['type'],
    },
  }))
}

export async function resolveQuery(id: string): Promise<Query> {
  const updated = await prisma.query.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date() },
  })

  return {
    id: updated.id,
    text: updated.text,
    blocking: updated.blocking,
    resolved: updated.resolved,
    resolvedAt: updated.resolvedAt,
    taskId: updated.taskId,
    raisedById: updated.raisedById,
    workspaceId: updated.workspaceId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}
