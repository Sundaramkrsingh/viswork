import { prisma } from './prisma'
import { getTaskHeat } from '@/lib/heat'
import { getSignalScore } from '@/lib/utils'
import type { Task, TeamMember, TaskWithRank, Query } from '@/lib/types'

export type TaskDetail = TaskWithRank & {
  assignee?: TeamMember
  queries: (Query & { raisedBy: TeamMember })[]
}

function toClientTask(task: {
  id: string
  title: string
  description: string | null
  type: string
  weight: string | null
  status: string
  assigneeId: string | null
  workspaceId: string
  links: string[]
  acceptanceCriteria: string | null
  cancelledAt: Date | null
  cancelReason: string | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type as Task['type'],
    weight: task.weight as Task['weight'],
    status: task.status as Task['status'],
    assigneeId: task.assigneeId,
    workspaceId: task.workspaceId,
    links: task.links,
    acceptanceCriteria: task.acceptanceCriteria,
    cancelledAt: task.cancelledAt,
    cancelReason: task.cancelReason,
    completedAt: task.completedAt,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
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

export async function getTask(id: string): Promise<TaskDetail | null> {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: true,
      queries: {
        where: { resolved: false },
        include: { raisedBy: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!task) return null

  const clientTask = toClientTask(task)

  const queries = task.queries.map((q) => ({
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
  }))

  return {
    ...clientTask,
    globalRank: 0, // rank is stack-relative; caller can ignore or compute separately
    heat: getTaskHeat(task.createdAt),
    signalScore: getSignalScore(clientTask),
    hasBlockingQuery: task.queries.some((q) => q.blocking),
    assignee: task.assignee ? toClientMember(task.assignee) : undefined,
    queries,
  }
}

export async function assignTask(id: string, assigneeId: string): Promise<Task> {
  const updated = await prisma.task.update({
    where: { id },
    data: {
      assigneeId,
      status: 'in_progress',
      updatedAt: new Date(),
    },
  })
  return toClientTask(updated)
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  const data: Record<string, unknown> = { status, updatedAt: new Date() }

  if (status === 'done') {
    data.completedAt = new Date()
  } else if (status === 'cancelled') {
    data.cancelledAt = new Date()
  } else {
    // Returning to active status — clear terminal timestamps
    data.completedAt = null
    data.cancelledAt = null
  }

  const updated = await prisma.task.update({ where: { id }, data })
  return toClientTask(updated)
}

export type CancelledTask = Task & {
  assignee?: TeamMember
}

export async function getCancelledTasks(workspaceId: string): Promise<CancelledTask[]> {
  const tasks = await prisma.task.findMany({
    where: { workspaceId, status: 'cancelled' },
    include: { assignee: true },
    orderBy: { cancelledAt: 'desc' },
  })

  return tasks.map((task) => ({
    ...toClientTask(task),
    assignee: task.assignee ? toClientMember(task.assignee) : undefined,
  }))
}

export async function getTeamMembers(workspaceId: string): Promise<TeamMember[]> {
  const members = await prisma.teamMember.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
  })
  return members.map(toClientMember)
}
