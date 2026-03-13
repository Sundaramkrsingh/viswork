# Viswork — Claude Code Project Context

## What is this?
Viswork is a **visual-first project management tool** for small engineering teams (~2–15 people).
The core philosophy: **no boring UI, everything communicates state visually**.

## Key Mental Model
- Tasks live in a **Master Stack** — a prioritized, visual queue. Engineers always pull from the top.
- The stack is not a kanban board. It is a **strict vertical queue** that enforces pull discipline.
- The manager controls stack order. Engineers do not reorder — they only pick.
- Everything is real-time. Status, availability, queries — all live.

## Current Phase
**MVP** — see `docs/PRD.md` for full scope, `docs/FEATURES.md` for feature breakdown.

## Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Framer Motion (heavy animation use)
- **UI primitives**: shadcn/ui (as base only, heavily customized visually)
- **Database**: PostgreSQL via Prisma ORM
- **Realtime**: Server-Sent Events (SSE) via `/api/events` — no external service
- **Auth**: NextAuth.js (credentials + magic link)
- **State**: Zustand + React Query (TanStack Query v5)

See `docs/TECH.md` for full schema and architecture.

## Project Structure (planned)
```
/app
  /(auth)          — login, invite
  /(app)
    /stack         — The Master Stack (main view)
    /team          — Team overview page
    /tasks/[id]    — Task detail
    /queries       — Blockers & queries board
    /graveyard     — Cancelled/archived tasks
/components
  /stack           — Stack-specific components
  /task-card       — Task card variants
  /team            — Team member components
  /queries         — Query/blocker components
  /ui              — Base shadcn components
/lib
  /db              — Prisma client
  /sse             — SSE broadcaster + client hook
  /ai              — Gemini embeddings + suggestion engine
  /utils
/prisma
  schema.prisma
```

## Core Entities
- **Task** — has type, priority, status, assignee, weight, signal clarity
- **TeamMember** — has role, availability status, current task
- **Query** — a blocker/question raised against a task, tagged to people
- **StackOrder** — manager-set ordering rules (e.g., bugs before features)

## Visual Design Rules (always follow these)
1. Task types have fixed brand colors — never deviate (see `docs/FEATURES.md`)
2. Cards pulse/glow when they are overdue or aging
3. Assignee avatars always show a colored role-ring
4. Completed tasks trigger a micro-celebration animation before leaving view
5. Everything that can be animated should be (Framer Motion), but never laggy
6. Dark mode first
7. No tables. No spreadsheet-style views. Use cards, stacks, visual layouts.

## Conventions
- All components are TypeScript with strict types
- Use `cn()` from `lib/utils` for conditional class merging
- Framer Motion variants should live in a `variants` const above the component
- Server components where possible, client components only when interactive
- Prisma queries in `/lib/db/` files, never inline in components
- API routes in `/app/api/` using Next.js Route Handlers

## Do not
- Add table/grid views — everything is card-based
- Add boring list views for tasks
- Use default shadcn styles without visual customization
- Skip animations for state transitions
