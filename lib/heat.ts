import { differenceInDays } from 'date-fns'

export type TaskHeat = 'cool' | 'warm' | 'hot'

export function getTaskHeat(createdAt: Date | string): TaskHeat {
  const daysOld = differenceInDays(new Date(), new Date(createdAt))
  if (daysOld < 3) return 'cool'
  if (daysOld < 7) return 'warm'
  return 'hot'
}

// Framer Motion animation variants for heat effects
export const heatVariants = {
  cool: {},
  warm: {
    boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.4)',
  },
  hot: {
    boxShadow: [
      '0 0 0 0 rgba(239, 68, 68, 0)',
      '0 0 0 8px rgba(239, 68, 68, 0.4)',
      '0 0 0 0 rgba(239, 68, 68, 0)',
    ],
  },
}

export const hotTransition = {
  repeat: Infinity,
  duration: 2,
  ease: 'easeInOut',
}
