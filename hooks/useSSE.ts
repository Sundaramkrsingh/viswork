'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { SSEEvent } from '@/lib/sse/broadcaster'

const EVENT_TO_QUERY_KEY: Record<SSEEvent, string[]> = {
  stack: ['stack'],
  team: ['members'],
  queries: ['queries'],
  missions: ['missions'],
  graveyard: ['graveyard'],
}

export function useSSE() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const es = new EventSource('/api/events')

    const handleEvent = (event: SSEEvent) => {
      const keys = EVENT_TO_QUERY_KEY[event]
      if (keys) {
        queryClient.invalidateQueries({ queryKey: keys })
      }
    }

    const events: SSEEvent[] = ['stack', 'team', 'queries', 'missions', 'graveyard']
    for (const ev of events) {
      es.addEventListener(ev, () => handleEvent(ev))
    }

    es.onerror = () => {
      // EventSource auto-reconnects on error
    }

    return () => {
      es.close()
    }
  }, [queryClient])
}