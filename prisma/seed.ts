import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean slate
  await prisma.stackOrder.deleteMany()
  await prisma.query.deleteMany()
  await prisma.task.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.workspace.deleteMany()

  // Workspace
  const workspace = await prisma.workspace.create({
    data: { name: 'Acme Engineering', slug: 'default' },
  })

  // Team members
  const [alice, bob, carol, dan] = await Promise.all([
    prisma.teamMember.create({
      data: {
        workspaceId: workspace.id,
        name: 'Alice Chen',
        email: 'alice@acme.dev',
        expertiseRoles: ['frontend', 'design systems', 'accessibility'],
        availability: 'available',
      },
    }),
    prisma.teamMember.create({
      data: {
        workspaceId: workspace.id,
        name: 'Bob Santos',
        email: 'bob@acme.dev',
        expertiseRoles: ['backend', 'postgres', 'infra'],
        availability: 'in_progress',
      },
    }),
    prisma.teamMember.create({
      data: {
        workspaceId: workspace.id,
        name: 'Carol Kim',
        email: 'carol@acme.dev',
        expertiseRoles: ['fullstack', 'react', 'typescript'],
        availability: 'flow_state',
        flowStateEndsAt: new Date(Date.now() + 90 * 60 * 1000), // 90 min from now
      },
    }),
    prisma.teamMember.create({
      data: {
        workspaceId: workspace.id,
        name: 'Dan Wright',
        email: 'dan@acme.dev',
        expertiseRoles: ['mobile', 'react native', 'ios'],
        availability: 'available',
      },
    }),
  ])

  // Tasks (mix of types, statuses, ages)
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

  const tasks = await Promise.all([
    // Bugs — top priority
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Login fails on Safari 17 — auth cookie not set',
        description: 'Reproducible on Safari 17.4+. Cookie SameSite=Lax breaks cross-site redirect. Impacts ~18% of users based on analytics.',
        type: 'bug',
        weight: 'M',
        status: 'unassigned',
        links: ['https://github.com/acme/app/issues/441'],
        acceptanceCriteria: 'Login works on Safari 17+. Cookie is set correctly.',
        createdAt: daysAgo(9),
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Race condition in task assignment websocket handler',
        description: 'Two simultaneous assignments to the same task can corrupt state. Seen in staging under load.',
        type: 'bug',
        weight: 'S',
        status: 'in_progress',
        assigneeId: bob.id,
        createdAt: daysAgo(4),
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Dashboard crashes when task list exceeds 500 items',
        description: 'Unhandled exception in virtual scroll. Stack trace points to line 182 of StackList.',
        type: 'bug',
        weight: 'S',
        status: 'unassigned',
        createdAt: daysAgo(2),
      },
    }),

    // Features
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Drag-to-reorder cards within the Master Stack',
        description: 'Manager needs to be able to drag tasks to reorder them. Should persist to DB and broadcast via realtime.',
        type: 'feature',
        weight: 'L',
        status: 'unassigned',
        links: ['https://www.figma.com/file/abc123/viswork-stack'],
        acceptanceCriteria: 'Drag works. Order persists. Other clients see update within 300ms.',
        createdAt: daysAgo(6),
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Task detail slide-over panel',
        description: 'Clicking a card opens a slide-over with full task details, activity log, and query thread.',
        type: 'feature',
        weight: 'M',
        status: 'in_progress',
        assigneeId: alice.id,
        links: ['https://www.figma.com/file/abc123/task-detail'],
        acceptanceCriteria: 'Panel animates in from right. Shows all task fields. Queries visible.',
        createdAt: daysAgo(3),
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Assignee suggestion chips on task card',
        description: 'Show top 3 suggested assignees based on availability + expertise. Tapping assigns instantly.',
        type: 'feature',
        weight: 'M',
        status: 'unassigned',
        createdAt: daysAgo(1),
      },
    }),

    // Refactors
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Extract auth middleware into shared lib',
        description: 'Currently duplicated across 6 API routes. Should be a single withAuth() wrapper.',
        type: 'refactor',
        weight: 'S',
        status: 'unassigned',
        createdAt: daysAgo(8),
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Replace raw SQL queries with Prisma in analytics module',
        type: 'refactor',
        weight: 'M',
        status: 'in_review',
        assigneeId: carol.id,
        createdAt: daysAgo(5),
      },
    }),

    // Spikes
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Spike: evaluate Liveblocks vs Partykit for realtime collaboration',
        description: 'We need conflict-free presence + cursor sharing eventually. Compare latency, pricing, DX.',
        type: 'spike',
        weight: 'S',
        status: 'unassigned',
        createdAt: daysAgo(2),
      },
    }),

    // Design
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Design system: define motion tokens (duration, easing curves)',
        description: 'All Framer Motion animations should use a shared set of spring/easing tokens. Establish them in Figma + code.',
        type: 'design',
        weight: 'S',
        status: 'unassigned',
        createdAt: daysAgo(0),
      },
    }),

    // Chores
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Upgrade Next.js to latest patch',
        type: 'chore',
        weight: 'XS',
        status: 'unassigned',
        createdAt: daysAgo(1),
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: 'Set up Sentry error tracking in production',
        description: 'Add @sentry/nextjs, configure DSN, add source maps upload in CI.',
        type: 'chore',
        weight: 'S',
        status: 'unassigned',
        createdAt: daysAgo(3),
      },
    }),
  ])

  // Add a blocking query on the Safari bug
  await prisma.query.create({
    data: {
      workspaceId: workspace.id,
      taskId: tasks[0].id,
      raisedById: alice.id,
      text: 'Do we need to support Safari < 17 as well? Fixing for 17+ might be a different approach.',
      blocking: true,
    },
  })

  // Stack ordering rules
  await prisma.stackOrder.create({
    data: {
      workspaceId: workspace.id,
      rules: {
        typeOrder: ['bug', 'feature', 'refactor', 'spike', 'design', 'chore'],
        withinTypeOrder: {
          bug: [tasks[0].id, tasks[1].id, tasks[2].id],
          feature: [tasks[3].id, tasks[4].id, tasks[5].id],
          refactor: [tasks[6].id, tasks[7].id],
        },
      },
    },
  })

  console.log(`Seeded:`)
  console.log(`  Workspace: ${workspace.name}`)
  console.log(`  Team members: 4 (Alice, Bob, Carol, Dan)`)
  console.log(`  Tasks: ${tasks.length}`)
  console.log(`  Stack order: set`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
