// Core type definitions for Viswork
// These mirror the Prisma schema but are safe for client-side use

export type TaskType = 'feature' | 'bug' | 'refactor' | 'chore' | 'spike' | 'design'
export type TaskWeight = 'XS' | 'S' | 'M' | 'L' | 'XL'
export type TaskStatus = 'unassigned' | 'in_progress' | 'in_review' | 'blocked' | 'done' | 'cancelled'
export type AvailabilityStatus = 'available' | 'in_progress' | 'in_review' | 'flow_state' | 'away'
export type MissionVisibility = 'personal' | 'team'

// Fixed brand colors for task types — never deviate
export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  feature: '#3B82F6',
  bug: '#EF4444',
  refactor: '#8B5CF6',
  chore: '#F59E0B',
  spike: '#06B6D4',
  design: '#EC4899',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  feature: 'Feature',
  bug: 'Bug',
  refactor: 'Refactor',
  chore: 'Chore',
  spike: 'Spike',
  design: 'Design',
}

// Number of dots shown per weight
export const TASK_WEIGHT_DOTS: Record<TaskWeight, number> = {
  XS: 1,
  S: 2,
  M: 3,
  L: 4,
  XL: 5,
}

export const TASK_WEIGHT_LABELS: Record<TaskWeight, string> = {
  XS: 'Tiny',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  XL: 'Epic',
}

// Weighted availability scores used in suggestion engine
export const AVAILABILITY_SCORES: Record<AvailabilityStatus, number> = {
  available: 1.0,
  in_review: 0.7,
  flow_state: 0.5,
  in_progress: 0.3,
  away: 0,
}

export const ALL_TASK_TYPES: TaskType[] = ['feature', 'bug', 'refactor', 'chore', 'spike', 'design']

// Stack ordering rules stored as JSON in DB
export interface StackOrderRules {
  typeOrder: TaskType[]
  withinTypeOrder: Partial<Record<TaskType, string[]>>
  pinnedTaskId?: string
}

// Client-side task shape
export interface Task {
  id: string
  title: string
  description?: string | null
  type: TaskType
  weight?: TaskWeight | null
  status: TaskStatus
  assigneeId?: string | null
  workspaceId: string
  links: string[]
  acceptanceCriteria?: string | null
  cancelledAt?: Date | string | null
  cancelReason?: string | null
  completedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  expertiseRoles: string[]
  availability: AvailabilityStatus
  flowStateEndsAt?: Date | string | null
  workspaceId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Query {
  id: string
  text: string
  blocking: boolean
  resolved: boolean
  resolvedAt?: Date | string | null
  taskId: string
  raisedById: string
  workspaceId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Mission {
  id: string
  title: string
  description?: string | null
  visibility: MissionVisibility
  deadline: Date | string
  workspaceId: string
  creatorId: string
  completedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface MissionItem {
  id: string
  missionId: string
  taskId?: string | null
  targetText?: string | null
  done: boolean
  doneAt?: Date | string | null
  position: number
  createdAt: Date | string
}

// Suggestion chip shape returned by the suggestion engine
export interface SuggestedAssignee {
  member: TeamMember
  matchReason: string
  score: number
}

// Task with computed fields for display
export interface TaskWithRank extends Task {
  globalRank: number
  heat: 'cool' | 'warm' | 'hot'
  signalScore: 1 | 2 | 3 | 4
  hasBlockingQuery: boolean
}
