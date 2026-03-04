import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"
import type { Task } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deterministic hue from an expertise tag string
// Same tag always produces the same color — no hardcoding needed
export function expertiseToHue(tag: string): number {
  let hash = 0
  for (const char of tag.toLowerCase()) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

// Usage: `hsl(${expertiseToHue(member.expertiseRoles[0])}, 70%, 60%)`
export function expertiseToColor(tag: string): string {
  return `hsl(${expertiseToHue(tag)}, 70%, 60%)`
}

export function formatAge(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: false })
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm')
}

// Signal clarity score — higher = more well-defined task
export function getSignalScore(task: Task): 1 | 2 | 3 | 4 {
  let score = 1
  if (task.description && task.description.length > 50) score++
  if (task.weight) score++
  if ((task.links && task.links.length > 0) || task.acceptanceCriteria) score++
  return score as 1 | 2 | 3 | 4
}

// Group an array by a key function
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
