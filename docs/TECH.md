# Viswork — Tech Stack & Architecture

## Stack Overview

| Layer         | Choice                      | Why                                              |
|---------------|-----------------------------|--------------------------------------------------|
| Framework     | Next.js 15 (App Router)     | RSC + server actions, no separate backend needed |
| Language      | TypeScript (strict)         | Type safety across DB → API → UI                 |
| Styling       | Tailwind CSS v4             | Utility-first, easy custom design tokens         |
| Animation     | Framer Motion v11           | Best-in-class declarative animations for React   |
| UI Primitives | shadcn/ui                   | Accessible base, fully ownable                   |
| Database      | PostgreSQL                  | Relational, fits task/team/query model well      |
| ORM           | Prisma 7                    | Type-safe queries, good migrations               |
| Realtime      | Supabase Realtime           | Postgres-backed, simple subscription API         |
| Auth          | NextAuth.js v4              | Email magic link, Prisma adapter                 |
| Email         | Nodemailer (SMTP)           | Magic links + invite emails, zero vendor lock-in |
| Client State  | Zustand                     | Minimal, for UI state (modal open, etc.)          |
| Server State  | TanStack Query v5           | Cache + refetch, works with Server Actions        |
| Confetti      | canvas-confetti             | Lightweight, fire-and-forget celebrations        |
| Embeddings    | OpenAI text-embedding-3-small| Semantic role→task matching for suggestions     |
| Vector search | Supabase pgvector           | Cosine similarity queries in Postgres            |

---

## Folder Structure

```
viswork/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── invite/[token]/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx           ← AppShell: header, radar widget
│   │   ├── stack/page.tsx       ← Master Stack
│   │   ├── team/page.tsx        ← Team Overview
│   │   ├── tasks/
│   │   │   └── [id]/page.tsx    ← Task Detail
│   │   ├── queries/page.tsx     ← Queries & Blockers board
│   │   ├── missions/page.tsx    ← Goal stacks (personal + team missions)
│   │   └── graveyard/page.tsx   ← Cancelled tasks
│   ├── api/
│   │   ├── tasks/route.ts
│   │   ├── tasks/[id]/route.ts
│   │   ├── queries/route.ts
│   │   ├── team/route.ts
│   │   ├── missions/route.ts
│   │   ├── missions/[id]/route.ts
│   │   ├── missions/[id]/items/route.ts
│   │   └── stack-order/route.ts
│   └── layout.tsx               ← Root layout (providers)
│
├── components/
│   ├── stack/
│   │   ├── StackView.tsx
│   │   ├── StackFilterTabs.tsx
│   │   ├── StackList.tsx
│   │   ├── TaskCard.tsx
│   │   ├── AssigneeSuggestionChips.tsx
│   │   ├── StackOrderPanel.tsx
│   │   ├── StackStats.tsx
│   │   └── HeatOverlay.tsx
│   ├── task/
│   │   ├── TaskDetail.tsx
│   │   ├── TaskTimeline.tsx
│   │   ├── ActivityLog.tsx
│   │   ├── TaskDNAStrip.tsx
│   │   ├── WeightIndicator.tsx
│   │   └── SignalClarity.tsx
│   ├── team/
│   │   ├── TeamGrid.tsx
│   │   ├── MemberCard.tsx
│   │   └── FlowStateAura.tsx
│   ├── queries/
│   │   ├── QueryBoard.tsx
│   │   ├── QueryCard.tsx
│   │   └── QueryComposer.tsx
│   ├── missions/
│   │   ├── MissionList.tsx
│   │   ├── MissionListItem.tsx
│   │   ├── MissionDetail.tsx
│   │   ├── MissionItemCard.tsx
│   │   ├── MissionCreateModal.tsx
│   │   ├── AddToMissionDrawer.tsx
│   │   └── MissionTimelineBar.tsx
│   ├── graveyard/
│   │   └── TombstoneCard.tsx
│   └── ui/
│       ├── RadarWidget.tsx
│       ├── TypeBadge.tsx
│       ├── AvatarRing.tsx
│       ├── ConfettiTrigger.tsx
│       └── (shadcn components)
│
├── lib/
│   ├── db/
│   │   ├── client.ts            ← Prisma client singleton
│   │   ├── tasks.ts             ← Task queries
│   │   ├── team.ts              ← Team member queries
│   │   ├── queries.ts           ← Query/blocker queries
│   │   ├── missions.ts          ← Mission queries + item sync logic
│   │   └── stack.ts             ← Stack order queries
│   ├── realtime/
│   │   ├── client.ts            ← Supabase client
│   │   └── subscriptions.ts     ← Channel subscriptions
│   ├── auth/
│   │   └── config.ts            ← NextAuth config
│   ├── utils.ts                 ← cn(), formatDate(), etc.
│   ├── heat.ts                  ← Task heat calculation
│   ├── signal.ts                ← Signal clarity score
│   └── suggestions.ts           ← Assignee suggestion logic
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── hooks/
│   ├── useStack.ts
│   ├── useTeam.ts
│   ├── useQueries.ts
│   └── useRealtime.ts
│
├── types/
│   └── index.ts                 ← Shared TypeScript types
│
└── stores/
    └── ui.ts                    ← Zustand store (modals, panels)
```

---

## Auth Architecture

### Overview
- **Provider:** NextAuth.js v4, Email provider (magic link) — no passwords
- **Mailer:** Nodemailer over SMTP — used for magic links and invite emails
- **Adapter:** `@auth/prisma-adapter` — stores Users, Sessions, Accounts, VerificationTokens in Postgres

### Auth ↔ App Identity
NextAuth manages the `User` model (just email + id for identity). Our `TeamMember` model is the app-layer entity. They are linked by `TeamMember.userId → User.id` (one-to-one, nullable until onboarding completes).

```
NextAuth User (auth identity)  ←─→  TeamMember (app entity: name, expertise, availability...)
       user.id                           member.userId
```

### Onboarding Guard
In `app/(app)/layout.tsx`: if session has no `memberId` → redirect to `/onboard/member`.
In `app/(auth)/onboard/workspace/page.tsx`: if a Workspace already exists → redirect to `/onboard/member`.

### Session Shape
Extended via `types/next-auth.d.ts`:
```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      memberId?: string       // TeamMember.id — undefined if not yet onboarded
      workspaceId?: string    // Workspace.id
    }
  }
}
```

### NextAuth Config (`lib/auth/config.ts`)
```typescript
import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLink } from '@/lib/email'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: '',         // unused — we override sendVerificationRequest
      from: process.env.EMAIL_FROM!,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendMagicLink({ to: email, url })
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
    newUser: '/onboard/workspace', // only hit if User is brand new
  },
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      const member = await prisma.teamMember.findUnique({
        where: { userId: user.id },
        select: { id: true, workspaceId: true },
      })
      session.user.id = user.id
      if (member) {
        session.user.memberId = member.id
        session.user.workspaceId = member.workspaceId
      }
      return session
    },
  },
}
```

Route handler: `app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Nodemailer (`lib/email.ts`)
```typescript
import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function sendMagicLink({ to, url }: { to: string; url: string }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Sign in to Viswork',
    text: `Sign in link: ${url}`,
    html: `<p>Click <a href="${url}">here</a> to sign in to Viswork. Link expires in 24 hours.</p>`,
  })
}

export async function sendInvite({
  to, inviteUrl, invitedBy, workspaceName,
}: { to: string; inviteUrl: string; invitedBy: string; workspaceName: string }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${invitedBy} invited you to ${workspaceName} on Viswork`,
    text: `Accept your invite: ${inviteUrl}`,
    html: `<p><strong>${invitedBy}</strong> invited you to join <strong>${workspaceName}</strong>.</p>
           <p><a href="${inviteUrl}">Accept invite</a> — expires in 7 days.</p>`,
  })
}
```

**Local dev:** Use [Ethereal](https://ethereal.email) — free fake SMTP, previews emails in browser. Create account at ethereal.email, copy credentials.

### Route Protection (`middleware.ts`)
```typescript
export { default } from 'next-auth/middleware'
export const config = {
  matcher: ['/stack/:path*', '/team/:path*', '/queries/:path*', '/missions/:path*', '/graveyard/:path*'],
}
```

### Invite Flow
1. POST `/api/invites` — auth required, creates `Invite` record with 7-day expiry, emails invite link
2. GET `/invite/[token]` page — validates token (not expired, not used), sets a cookie with email, redirects to `/login`
3. After magic link auth, if the User's email matches a pending Invite → mark invite as used → proceed to `/onboard/member`
4. `/onboard/member` — creates TeamMember linked to session User

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TaskType {
  feature
  bug
  refactor
  chore
  spike
  design
}

enum TaskWeight {
  XS
  S
  M
  L
  XL
}

enum TaskStatus {
  unassigned
  in_progress
  in_review
  blocked
  done
  cancelled
}

// No fixed MemberRole enum — roles are custom free-text expertise tags per member,
// ordered by proficiency. Stored as a string array on TeamMember.

enum AvailabilityStatus {
  available
  in_progress
  in_review
  flow_state
  away
}

enum QuerySeverity {
  blocking
  non_blocking
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  createdAt   DateTime @default(now())
  members     TeamMember[]
  tasks       Task[]
  stackOrder  StackOrder?
}

model TeamMember {
  id               String             @id @default(cuid())
  name             String
  email            String             @unique
  avatarUrl        String?
  // Custom expertise tags, ordered by proficiency (index 0 = primary)
  // e.g. ["React", "TypeScript", "Node.js"]
  expertiseRoles   String[]           @default([])
  // Embedding of joined expertiseRoles string — computed on role save via OpenAI API
  // Stored as pgvector for cosine similarity search at suggestion time
  roleVector       Unsupported("vector(1536)")?
  availability     AvailabilityStatus @default(available)
  flowStateEndsAt  DateTime?
  workspaceId      String
  workspace        Workspace          @relation(fields: [workspaceId], references: [id])
  assignedTasks    Task[]             @relation("AssignedTo")
  raisedQueries    Query[]            @relation("RaisedBy")
  taggedInQueries  QueryTag[]
  reactions        TaskReaction[]
  missions         Mission[]          @relation("CreatedMissions")
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

model Task {
  id                  String       @id @default(cuid())
  title               String
  description         String?
  type                TaskType
  weight              TaskWeight?
  status              TaskStatus   @default(unassigned)
  stackPosition       Int?         // null = no specific position, ordered by rules
  workspaceId         String
  workspace           Workspace    @relation(fields: [workspaceId], references: [id])
  assigneeId          String?
  assignee            TeamMember?  @relation("AssignedTo", fields: [assigneeId], references: [id])
  links               String[]     // URLs
  acceptanceCriteria  String?
  queries             Query[]
  reactions           TaskReaction[]
  blockedBy           TaskLink[]   @relation("BlockedTask")
  blocks              TaskLink[]   @relation("BlockingTask")
  activityLog         ActivityEntry[]
  cancelledAt         DateTime?
  cancelReason        String?
  completedAt         DateTime?
  // Embedding of title + description + type — computed on task create/update
  taskVector          Unsupported("vector(1536)")?
  missionItems        MissionItem[]
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model TaskLink {
  id            String @id @default(cuid())
  blockedTaskId String
  blockedTask   Task   @relation("BlockedTask", fields: [blockedTaskId], references: [id])
  blockingTaskId String
  blockingTask  Task   @relation("BlockingTask", fields: [blockingTaskId], references: [id])
}

model Query {
  id          String        @id @default(cuid())
  text        String
  severity    QuerySeverity @default(non_blocking)
  resolved    Boolean       @default(false)
  resolvedAt  DateTime?
  taskId      String
  task        Task          @relation(fields: [taskId], references: [id])
  raisedById  String
  raisedBy    TeamMember    @relation("RaisedBy", fields: [raisedById], references: [id])
  tags        QueryTag[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model QueryTag {
  id           String     @id @default(cuid())
  queryId      String
  query        Query      @relation(fields: [queryId], references: [id])
  memberId     String
  member       TeamMember @relation(fields: [memberId], references: [id])
  responded    Boolean    @default(false)
  respondedAt  DateTime?
}

model StackOrder {
  id          String    @id @default(cuid())
  workspaceId String    @unique
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  // Two-layer ordering:
  // typeOrder: ['bug','feature','refactor',...] — which type group floats to master stack top
  // withinTypeOrder: { bug: ['taskId1','taskId2',...], feature: [...] } — order within each type
  // pinnedTaskId: 'taskId' — overrides all rules, always on top (optional)
  rules       Json
  updatedAt   DateTime  @updatedAt
}

model ActivityEntry {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  actorName String
  action    String   // "assigned", "status_changed", "query_raised", etc.
  metadata  Json?    // { from: 'unassigned', to: 'in_progress' }
  createdAt DateTime @default(now())
}

model TaskReaction {
  id        String     @id @default(cuid())
  emoji     String
  taskId    String
  task      Task       @relation(fields: [taskId], references: [id])
  memberId  String
  member    TeamMember @relation(fields: [memberId], references: [id])
  createdAt DateTime   @default(now())

  @@unique([taskId, memberId, emoji])
}

// Missions — goal stacks (intent layer above the main stack)
// A mission holds references to main stack tasks + lightweight standalone targets
// No task data is duplicated — linked items are just foreign keys

enum MissionVisibility {
  personal
  team
}

model Mission {
  id          String            @id @default(cuid())
  title       String
  description String?
  visibility  MissionVisibility @default(personal)
  deadline    DateTime
  workspaceId String
  workspace   Workspace         @relation(fields: [workspaceId], references: [id])
  creatorId   String
  creator     TeamMember        @relation("CreatedMissions", fields: [creatorId], references: [id])
  items       MissionItem[]
  completedAt DateTime?         // set when all items are done before deadline
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model MissionItem {
  id         String   @id @default(cuid())
  missionId  String
  mission    Mission  @relation(fields: [missionId], references: [id], onDelete: Cascade)
  // Exactly one of taskId OR standalone fields must be set
  taskId     String?           // reference to a main stack task (nullable)
  task       Task?    @relation(fields: [taskId], references: [id])
  // Standalone target fields (only used when taskId is null)
  targetText String?
  done       Boolean  @default(false)
  doneAt     DateTime?
  position   Int               // order within the mission
  createdAt  DateTime @default(now())
}

// ---- Auth models (required by NextAuth.js v4 + @auth/prisma-adapter) ----

model User {
  id            String     @id @default(cuid())
  name          String?
  email         String     @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  member        TeamMember?   // one-to-one link; null until /onboard/member is completed
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ---- Invites ----

model Invite {
  id          String     @id @default(cuid())
  email       String
  workspaceId String
  workspace   Workspace  @relation(fields: [workspaceId], references: [id])
  token       String     @unique @default(cuid())
  expiresAt   DateTime   // 7 days from creation
  usedAt      DateTime?
  invitedById String
  invitedBy   TeamMember @relation("SentInvites", fields: [invitedById], references: [id])
  createdAt   DateTime   @default(now())
}
```

**Also add to existing models:**

`TeamMember`:
```
userId      String?    @unique
user        User?      @relation(fields: [userId], references: [id])
invitesSent Invite[]   @relation("SentInvites")
```

`Workspace`:
```
invites     Invite[]
```

---

## Stack Sorting Algorithm

Sub-stacks are views — sorting is computed client-side from a single tasks list.

```typescript
// lib/stack.ts

interface StackOrderRules {
  typeOrder: TaskType[]                        // global type priority
  withinTypeOrder: Partial<Record<TaskType, string[]>>  // taskId arrays per type
  pinnedTaskId?: string                        // always on top
}

export function sortForMasterStack(
  tasks: Task[],
  rules: StackOrderRules
): Task[] {
  // 1. Separate pinned task
  const pinned = rules.pinnedTaskId
    ? tasks.filter(t => t.id === rules.pinnedTaskId)
    : []
  const rest = tasks.filter(t => t.id !== rules.pinnedTaskId)

  // 2. Group by type
  const byType = groupBy(rest, t => t.type)

  // 3. Within each type, sort by withinTypeOrder, then by createdAt
  const sortedByType = rules.typeOrder.flatMap(type => {
    const group = byType[type] ?? []
    const order = rules.withinTypeOrder[type] ?? []
    return group.sort((a, b) => {
      const ai = order.indexOf(a.id)
      const bi = order.indexOf(b.id)
      if (ai === -1 && bi === -1) return a.createdAt.getTime() - b.createdAt.getTime()
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  })

  // 4. Append any types not in typeOrder at the end
  const coveredTypes = new Set(rules.typeOrder)
  const overflow = rest.filter(t => !coveredTypes.has(t.type))

  return [...pinned, ...sortedByType, ...overflow]
}

export function sortForSubStack(
  tasks: Task[],
  type: TaskType,
  rules: StackOrderRules
): Task[] {
  // Filter to type, then apply within-type order only
  const filtered = tasks.filter(t => t.type === type)
  const order = rules.withinTypeOrder[type] ?? []
  return filtered.sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    if (ai === -1 && bi === -1) return a.createdAt.getTime() - b.createdAt.getTime()
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

// Global rank is always computed from master stack sort
// Sub-stack cards show their global rank (not re-numbered)
export function computeGlobalRanks(sortedTasks: Task[]): Map<string, number> {
  return new Map(sortedTasks.map((t, i) => [t.id, i + 1]))
}
```

**Key point:** `sortForMasterStack` and `sortForSubStack` both operate on the same `tasks` array fetched once. The sub-stack just passes a `type` filter. No separate API call needed for sub-stacks — just client-side computation.

---

## Realtime Architecture

Using Supabase Realtime (Postgres Changes):

```typescript
// lib/realtime/subscriptions.ts

// Subscribe to task status changes (for stack updates)
supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'Task',
    filter: `workspaceId=eq.${workspaceId}`
  }, handleTaskChange)
  .subscribe()

// Subscribe to availability changes (for team page)
supabase
  .channel('team')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'TeamMember',
    filter: `workspaceId=eq.${workspaceId}`
  }, handleMemberChange)
  .subscribe()

// Subscribe to new queries
supabase
  .channel('queries')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'Query'
  }, handleNewQuery)
  .subscribe()
```

---

## Assignee Suggestion Engine

Roles are custom free-text strings, so we use semantic embeddings instead of enum matching.

### How it works

**Step 1 — Pre-compute role vectors (on member profile save)**
```typescript
// lib/embeddings.ts

export async function computeRoleVector(expertiseRoles: string[]): Promise<number[]> {
  // Join roles into a single descriptive string — order matters (primary first)
  const input = expertiseRoles.join(', ')
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  })
  return res.data[0].embedding // 1536-dimensional vector
}

export async function computeTaskVector(task: { title: string; description?: string; type: string }): Promise<number[]> {
  const input = `${task.type}: ${task.title}. ${task.description ?? ''}`
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  })
  return res.data[0].embedding
}
```

**Step 2 — Similarity query at suggestion time**

The heavy lifting is done in Postgres via pgvector. No application-side math needed.

```sql
-- lib/db/suggestions.ts (raw query via Prisma $queryRaw)

SELECT
  id,
  name,
  "expertiseRoles",
  availability,
  "flowStateEndsAt",
  1 - ("roleVector" <=> $1::vector) AS semantic_score
FROM "TeamMember"
WHERE
  "workspaceId" = $2
  AND availability != 'away'
  AND "roleVector" IS NOT NULL
ORDER BY
  -- Weighted blend: 60% semantic match + 40% availability
  (1 - ("roleVector" <=> $1::vector)) * 0.6
  + (CASE availability
      WHEN 'available'    THEN 1.0
      WHEN 'in_review'    THEN 0.7
      WHEN 'flow_state'   THEN 0.5
      WHEN 'in_progress'  THEN 0.3
      ELSE 0
    END) * 0.4
  DESC
LIMIT 3
```

**Step 3 — Match reason label**

To show the "why" on each suggestion chip, find the member's top-matching expertise tag against the task text client-side (simple substring/overlap check on the already-fetched data — no extra API call):

```typescript
// lib/suggestions.ts

export function getMatchReason(
  member: { expertiseRoles: string[] },
  task: { title: string; type: string }
): string {
  const taskText = `${task.type} ${task.title}`.toLowerCase()
  // Return the first expertise tag that appears in the task text
  const match = member.expertiseRoles.find(role =>
    taskText.includes(role.toLowerCase())
  )
  // Fallback: just show their primary expertise
  return match ?? member.expertiseRoles[0] ?? ''
}
```

**Result:** `Ravi · React ·  ` — name, matched skill, availability indicator.

### When vectors are computed

| Event | Action |
|-------|--------|
| Member saves/updates expertise roles | Recompute `roleVector`, store in DB |
| Task is created | Compute `taskVector`, store in DB |
| Task title/description is edited | Recompute `taskVector` |
| Suggestion chips render | Run SQL query above (fast — vector index) |

Vectors are never computed on the client. Always a server action or API route call.

### pgvector setup (Supabase)

```sql
-- Run once in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX ON "TeamMember" USING ivfflat ("roleVector" vector_cosine_ops);
CREATE INDEX ON "Task" USING ivfflat ("taskVector" vector_cosine_ops);
```

---

## Environment Variables

```env
# .env (Prisma reads this — DATABASE_URL must be here)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/viswork"

# .env.local (Next.js reads this — all other vars)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate: openssl rand -base64 32"

# SMTP — use Ethereal (https://ethereal.email) for local dev
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-ethereal-user@ethereal.email"
SMTP_PASS="your-ethereal-password"
EMAIL_FROM="Viswork <noreply@viswork.app>"

# Supabase (for realtime — optional until Phase realtime)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# OpenAI (deferred to suggestion engine phase)
OPENAI_API_KEY="..."
```

---

## Key Design Decisions

### Why stack instead of board?
A kanban board gives engineers choice paralysis and allows cherry-picking. A stack enforces pull discipline — you take what's next, not what looks interesting. The manager controls priority; the engineer controls execution.

### Why not separate backend?
Next.js Server Actions + Route Handlers handle all server-side logic. Supabase handles realtime. No need to maintain a separate Express/Fastify server for MVP.

### Why Supabase Realtime over Socket.io?
Supabase Realtime is backed directly by Postgres changes — no need to manually emit events from the API. Any database change automatically propagates to subscribed clients.

### Why Prisma over Drizzle?
Prisma's type generation is more ergonomic for a rapidly built MVP. Drizzle offers better raw performance but the DX overhead isn't worth it at this stage.

### Why no fixed permission roles?
MVP targets small, trusted teams. Permission gating adds complexity and friction without meaningful benefit at this scale. Anyone can do anything. Roles are expertise tags only — they influence suggestions, not access.

### Why embeddings over enum role matching?
Custom free-text expertise roles cannot be matched with enums. "React Developer", "React.js", and "Frontend - React" are all semantically identical. Embeddings handle synonyms, partial matches, and novel skill names without any rule maintenance. Pre-computing vectors at save time means suggestion queries are just a fast SQL call — no LLM latency at render.

---

## Cross-Platform Strategy

**Now:** Next.js web app. This is the source of truth.

**Desktop (when ready): Tauri**
- Wraps the existing Next.js app in a native shell
- ~2MB binary vs Electron's 200MB+
- Uses the OS native webview — no bundled Chromium
- Zero application code rewrite

**Mobile (when ready): React Native (Expo)**
- Shares TypeScript types with Next.js
- Connects to the same Next.js API routes — no backend changes
- React patterns already known from web development
- NOT Flutter: Flutter requires a full rewrite in Dart, splits web and mobile into two codebases with zero shared code

**The key:** Build Next.js API routes as a clean, platform-agnostic REST API from day one. Every client (web, Tauri, React Native) calls the same endpoints.

```
                    ┌─────────────────┐
                    │  Next.js API    │
                    │  Route Handlers │  ← single backend, no changes per client
                    └────────┬────────┘
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                   ▼
  Next.js Web          Tauri Desktop        React Native
  (primary, now)       (wrap web app)       (mobile, v2)
                       minimal extra work   shared types + API
```

---

## Bootstrap Commands

```bash
# Init project
npx create-next-app@latest viswork --typescript --tailwind --app --src-dir=false

# Add dependencies
npm install prisma @prisma/client @supabase/supabase-js
npm install next-auth @auth/prisma-adapter
npm install nodemailer         # email sending
npm install -D @types/nodemailer
npm install framer-motion zustand @tanstack/react-query
npm install canvas-confetti date-fns openai
npm install -D @types/canvas-confetti

# Enable pgvector in Supabase SQL editor (run once):
# CREATE EXTENSION IF NOT EXISTS vector;
# CREATE INDEX ON "TeamMember" USING ivfflat ("roleVector" vector_cosine_ops);
# CREATE INDEX ON "Task" USING ivfflat ("taskVector" vector_cosine_ops);

# Init Prisma
npx prisma init
# (paste schema, then:)
npx prisma migrate dev --name init
npx prisma generate

# Add shadcn
npx shadcn@latest init
npx shadcn@latest add button badge avatar card drawer dialog tooltip
```
