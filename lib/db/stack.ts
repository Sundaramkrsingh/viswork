import { prisma } from './prisma'
import { getTaskHeat } from '@/lib/heat'
import { getSignalScore } from '@/lib/utils'
import type { TaskWithRank, StackOrderRules, TaskType, Task, TeamMember } from '@/lib/types'

// Default type order when no StackOrder exists
const DEFAULT_TYPE_ORDER: TaskType[] = ['bug', 'feature', 'refactor', 'spike', 'design', 'chore']

const DEFAULT_WORKSPACE_SLUG = 'default'

export async function getOrCreateDefaultWorkspace() {
  let workspace = await prisma.workspace.findUnique({
    where: { slug: DEFAULT_WORKSPACE_SLUG },
  })
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: 'Default', slug: DEFAULT_WORKSPACE_SLUG },
    })
  }
  return workspace
}

export async function getStack(workspaceId: string): Promise<TaskWithRank[]> {
  const [tasks, stackOrder] = await Promise.all([
    prisma.task.findMany({
      where: {
        workspaceId,
        status: { notIn: ['done', 'cancelled'] },
      },
      include: {
        assignee: true,
        queries: { where: { resolved: false } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.stackOrder.findUnique({ where: { workspaceId } }),
  ])

  const rules: StackOrderRules = stackOrder
    ? (stackOrder.rules as unknown as StackOrderRules)
    : { typeOrder: DEFAULT_TYPE_ORDER, withinTypeOrder: {} }

  const typeOrder = rules.typeOrder ?? DEFAULT_TYPE_ORDER

  // Sort tasks: first by type position, then by within-type order or createdAt
  const sorted = [...tasks].sort((a, b) => {
    const aTypeIdx = typeOrder.indexOf(a.type as TaskType)
    const bTypeIdx = typeOrder.indexOf(b.type as TaskType)
    const aPos = aTypeIdx === -1 ? 99 : aTypeIdx
    const bPos = bTypeIdx === -1 ? 99 : bTypeIdx

    if (aPos !== bPos) return aPos - bPos

    // Within same type: use withinTypeOrder if available
    const withinOrder = rules.withinTypeOrder?.[a.type as TaskType] ?? []
    const aInnerIdx = withinOrder.indexOf(a.id)
    const bInnerIdx = withinOrder.indexOf(b.id)

    if (aInnerIdx !== -1 && bInnerIdx !== -1) return aInnerIdx - bInnerIdx
    if (aInnerIdx !== -1) return -1
    if (bInnerIdx !== -1) return 1

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  // Build TaskWithRank[]
  return sorted.map((task, idx) => {
    const clientTask: Task = {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type as TaskType,
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

    const assignee: TeamMember | undefined = task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
          avatarUrl: task.assignee.avatarUrl,
          expertiseRoles: task.assignee.expertiseRoles,
          availability: task.assignee.availability as TeamMember['availability'],
          flowStateEndsAt: task.assignee.flowStateEndsAt,
          workspaceId: task.assignee.workspaceId,
          createdAt: task.assignee.createdAt.toISOString(),
          updatedAt: task.assignee.updatedAt.toISOString(),
        }
      : undefined

    return {
      ...clientTask,
      globalRank: idx + 1,
      heat: getTaskHeat(task.createdAt),
      signalScore: getSignalScore(clientTask),
      hasBlockingQuery: task.queries.some((q) => q.blocking),
      assignee,
    } as TaskWithRank & { assignee?: TeamMember }
  })
}
