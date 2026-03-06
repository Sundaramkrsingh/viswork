import { prisma } from './prisma'
import type { MissionVisibility, Task, TeamMember } from '@/lib/types'

export type MissionItemWithTask = {
  id: string
  missionId: string
  taskId: string | null
  task: Pick<Task, 'id' | 'title' | 'type' | 'status'> | null
  targetText: string | null
  done: boolean
  doneAt: string | null
  position: number
  createdAt: string
}

export type MissionWithItems = {
  id: string
  title: string
  description: string | null
  visibility: MissionVisibility
  deadline: string
  workspaceId: string
  creatorId: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
  creator: Pick<TeamMember, 'id' | 'name' | 'avatarUrl' | 'expertiseRoles'>
  items: MissionItemWithTask[]
}

export type MissionSummary = {
  id: string
  title: string
  description: string | null
  visibility: MissionVisibility
  deadline: string
  workspaceId: string
  creatorId: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
  creator: Pick<TeamMember, 'id' | 'name' | 'avatarUrl' | 'expertiseRoles'>
  itemCount: number
  doneCount: number
}

function itemIsDone(item: { taskId: string | null; task: { status: string } | null; done: boolean }): boolean {
  if (item.taskId && item.task) return item.task.status === 'done'
  return item.done
}

function toItemWithTask(item: {
  id: string
  missionId: string
  taskId: string | null
  task: { id: string; title: string; type: string; status: string } | null
  targetText: string | null
  done: boolean
  doneAt: Date | null
  position: number
  createdAt: Date
}): MissionItemWithTask {
  return {
    id: item.id,
    missionId: item.missionId,
    taskId: item.taskId,
    task: item.task
      ? {
          id: item.task.id,
          title: item.task.title,
          type: item.task.type as Task['type'],
          status: item.task.status as Task['status'],
        }
      : null,
    targetText: item.targetText,
    done: item.done,
    doneAt: item.doneAt?.toISOString() ?? null,
    position: item.position,
    createdAt: item.createdAt.toISOString(),
  }
}

export async function getMissions(workspaceId: string): Promise<MissionSummary[]> {
  const missions = await prisma.mission.findMany({
    where: { workspaceId },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true, expertiseRoles: true } },
      items: {
        include: { task: { select: { id: true, status: true } } },
      },
    },
    orderBy: { deadline: 'asc' },
  })

  return missions.map((m) => {
    const doneCount = m.items.filter((i) =>
      itemIsDone({ taskId: i.taskId, task: i.task, done: i.done })
    ).length

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      visibility: m.visibility as MissionVisibility,
      deadline: m.deadline.toISOString(),
      workspaceId: m.workspaceId,
      creatorId: m.creatorId,
      completedAt: m.completedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      creator: m.creator,
      itemCount: m.items.length,
      doneCount,
    }
  })
}

export async function getMission(id: string): Promise<MissionWithItems | null> {
  const m = await prisma.mission.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true, expertiseRoles: true } },
      items: {
        include: { task: { select: { id: true, title: true, type: true, status: true } } },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!m) return null

  return {
    id: m.id,
    title: m.title,
    description: m.description,
    visibility: m.visibility as MissionVisibility,
    deadline: m.deadline.toISOString(),
    workspaceId: m.workspaceId,
    creatorId: m.creatorId,
    completedAt: m.completedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    creator: m.creator,
    items: m.items.map(toItemWithTask),
  }
}

export async function createMission(data: {
  title: string
  description?: string
  visibility: MissionVisibility
  deadline: Date
  workspaceId: string
  creatorId: string
}): Promise<MissionSummary> {
  const m = await prisma.mission.create({
    data: {
      title: data.title,
      description: data.description,
      visibility: data.visibility,
      deadline: data.deadline,
      workspaceId: data.workspaceId,
      creatorId: data.creatorId,
    },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true, expertiseRoles: true } },
    },
  })

  return {
    id: m.id,
    title: m.title,
    description: m.description,
    visibility: m.visibility as MissionVisibility,
    deadline: m.deadline.toISOString(),
    workspaceId: m.workspaceId,
    creatorId: m.creatorId,
    completedAt: null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    creator: m.creator,
    itemCount: 0,
    doneCount: 0,
  }
}

export async function addMissionItem(
  missionId: string,
  data: { taskId?: string; targetText?: string }
): Promise<MissionItemWithTask> {
  const lastItem = await prisma.missionItem.findFirst({
    where: { missionId },
    orderBy: { position: 'desc' },
  })
  const position = (lastItem?.position ?? -1) + 1

  const item = await prisma.missionItem.create({
    data: { missionId, taskId: data.taskId, targetText: data.targetText, position },
    include: { task: { select: { id: true, title: true, type: true, status: true } } },
  })

  return toItemWithTask(item)
}

export async function toggleMissionItem(
  itemId: string
): Promise<{ item: MissionItemWithTask; allDone: boolean }> {
  const current = await prisma.missionItem.findUniqueOrThrow({ where: { id: itemId } })

  // Only standalone targets can be toggled
  const newDone = !current.done
  const updated = await prisma.missionItem.update({
    where: { id: itemId },
    data: { done: newDone, doneAt: newDone ? new Date() : null },
    include: { task: { select: { id: true, title: true, type: true, status: true } } },
  })

  // Check if all items in the mission are now done
  const allItems = await prisma.missionItem.findMany({
    where: { missionId: current.missionId },
    include: { task: { select: { status: true } } },
  })
  const allDone = allItems.every((i) =>
    itemIsDone({ taskId: i.taskId, task: i.task, done: i.id === itemId ? newDone : i.done })
  )

  if (allDone) {
    await prisma.mission.update({
      where: { id: current.missionId },
      data: { completedAt: new Date() },
    })
  } else {
    await prisma.mission.update({
      where: { id: current.missionId },
      data: { completedAt: null },
    })
  }

  return { item: toItemWithTask(updated), allDone }
}
