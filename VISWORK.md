# Viswork

A visual-first project management tool for small engineering teams. Not another Jira. Not another Trello. The bet is that small teams move faster when there's one shared visual truth about what to work on next — and it's enforced, not suggested.

---

## The Philosophy

Most PM tools are glorified spreadsheets. They give engineers infinite choice about what to pick next, allow managers to set "priority" that everyone ignores, and bury actual status behind clicks and filters. Viswork is opinionated about a few things:

- Tasks live in a queue. Engineers pull from the top. They don't choose what looks interesting.
- The queue order is controlled by whoever manages the team — but anyone can pick and move work forward.
- Everything communicates state visually. Heat, color, animation, presence — the UI itself tells you what needs attention.

**Target:** teams of 2–15. One person owns the queue order, everyone pulls from it.

**Permissions:** In MVP, there are no access restrictions. Anyone on the team can do anything — reorder the stack, cancel tasks, pick anything, raise queries, create missions. No role-based gating. This keeps the tool fast and frictionless for small teams that trust each other.

---

## Team Members & Expertise Roles

Instead of fixed system roles (manager/engineer), each team member has a list of **custom expertise tags** they set themselves, ordered by how strong they are in each area.

Example: `["React", "TypeScript", "GraphQL", "Node.js"]` — React is their primary expertise, Node.js is secondary or learning.

**How ordering works in the UI:**
- The first tag is displayed prominently (larger, full color)
- Subsequent tags get progressively smaller and slightly faded
- On the team member card, you see at a glance: their main skill front and center, secondary skills trailing off
- When editing, they drag to reorder

**Why this matters:**
This ordering is used by the suggestion engine when recommending who should pick up a task. Primary expertise gets stronger weight.

---

## The Master Stack

The main page of the app. A vertical, prioritized queue of all unassigned tasks.

Each task card shows: title, type (colored badge), weight (dot cluster for XS/S/M/L/XL), how long it's been sitting there, and who should probably pick it up next.

**Task types and their colors:**
- Feature → Blue
- Bug → Red
- Refactor → Purple
- Chore → Amber
- Spike → Cyan
- Design → Pink

The queue has two ordering layers. First, which type group floats to the top globally — you might want bugs always before features. Second, the order within a type — bug #1 before bug #2. Both layers live in a single config. Anyone can change the order. Anyone can pick.

**Task heat** — tasks that sit unassigned too long get visually "hotter." 0–2 days: normal. 3–5 days: amber glow border. 6+ days: red pulsing border with a subtle shake on hover. Silent pressure to clear old items.

**Signal clarity** — each card shows a WiFi-bar style icon (1–4 bars) based on how well-defined the task is: title only = 1 bar, has description + weight + links = 4 bars. No enforcement, just a visible nudge to write better tasks.

**Picking discipline** — the UI doesn't let you pick task #3 while #1 and #2 are unassigned and unblocked. Exception: if a task has an open blocking query, it's skippable and the next one becomes pickable.

---

## Sub-Stacks (Type Views)

The master stack can be filtered by type. Critical design decision: these are not separate queues. They are filtered views of the same data. A task exists in exactly one place. Picking from any view is the same action. No sync problem.

A frontend-focused person mostly cares about features, design, refactors — not devops chores. So the stack defaults to their relevant types based on their primary expertise. They can always switch to "All."

Cards in a sub-stack still show their global rank number from the master stack. In the bug sub-stack you might see rank #1, #3, #7 — the gaps are features and refactors. This keeps rank numbers meaningful.

---

## Smart Assignee Suggestions

The top tasks in the stack show avatar chips for who should probably pick them up. This is powered by a semantic suggestion engine (see below).

Each chip shows: avatar, name, primary expertise tag, availability status ring.

---

## The Suggestion Engine

Since expertise roles are custom free-text strings, we can't do simple enum matching. "React Developer", "React", and "Frontend Engineer" are all the same thing semantically. We use embeddings to handle this properly.

**How it works:**

1. **When a member saves their roles**, compute a single embedding vector from their joined expertise tags: `"React TypeScript GraphQL Node.js"`. Store this vector in the database next to the member record. Only recomputed on role change — not on every render.

2. **When a task is created or updated**, compute an embedding from its title + description + type: `"Bug: Fix login redirect loop after OAuth callback"`. Store with the task.

3. **At suggestion time**, find the closest member vectors to the task vector using cosine similarity. Filter out members who are away. Weight the final score: `(semantic match 60%) + (availability 40%)`.

4. **Availability scoring:** Available = 1.0, In Review = 0.7, Flow State = 0.5, In Progress = 0.3, Away = excluded.

**The result:** Given a task about "React component performance regression", the engine surfaces your React specialists first, even if they wrote their role as "Frontend Developer - React" rather than just "React". No keyword matching, no brittle tag logic.

**Explainability:** Each suggestion chip shows a small reason label — the member's top-matching expertise tag for that task. So you see: `Ravi · React ·  ` rather than just a name.

**The tech:** OpenAI `text-embedding-3-small` (very cheap, fast). Vectors stored in Postgres via Supabase's built-in `pgvector` extension. The similarity query is a single SQL call.

```
SELECT member, 1 - (role_vector <=> task_vector) AS similarity
FROM members
WHERE availability != 'away'
ORDER BY similarity * 0.6 + availability_score * 0.4 DESC
LIMIT 3
```

Clean, fast, no complex logic in application code.

---

## Team Overview Page

A grid of member cards showing the whole team's current state at a glance.

Each card: avatar with availability ring, name, expertise tags (primary prominent, others trailing), current task pill, availability status.

**Flow State** — any member can activate a deep-work timer (25min / 60min / custom). While active, their avatar pulses with a soft glow, others see "In flow until 3:45 PM," and the suggestion engine de-prioritizes them for new tasks. Social signal, not a lock.

---

## Task Detail Page

Full task view: description (markdown), type, weight, status, assignee, linked tasks. A horizontal **DNA strip** shows the full lifecycle — time spent in each status as colored segments. Hover to see exact dates. Activity log: who changed what and when.

---

## Queries & Blockers

Raised from inside a task. Tag one or more people who need to respond. Toggle blocking vs non-blocking.

Blocking queries show a chain-link icon on the task card. Tagged people see a query badge on their team card. The Queries page is two columns: Blocking | Non-blocking, sorted by age.

---

## Missions (Goal Stacks)

The intent layer sitting above the execution layer. A Mission is a timed container you fill with targets and race to empty.

The main stack is about *what to work on*. Missions are about *what we're trying to achieve by when*. Complementary, not duplicates.

**Two kinds of items in a mission:**
1. **Linked tasks** — references to real tasks in the main stack. When the task is marked done there, it auto-clears from the mission. The mission card shows the task's live status.
2. **Standalone targets** — simple checkboxes for non-engineering work ("write API docs", "review PR #42"). These live only in the mission.

A task can be in multiple missions simultaneously — it's just a reference, never a copy.

**Personal vs team:** Personal missions are only visible to you. Team missions are visible to the whole workspace. Anyone can create either type.

**The emptying mechanic:** A timeline bar across the top "runs out" toward the deadline — you watch it fill up, creating urgency. Items complete and animate off. When everything is done before the deadline: victory state — gold border, confetti, "finished with X days to spare." If the deadline passes with items remaining: the mission dims quietly. No drama. Lessons, not shame.

Missions never affect the main stack's ordering. The stack discipline stays intact.

---

## The Graveyard

Where cancelled tasks go. Dark, desaturated view. Cards styled as tombstones — slightly tilted, faded type colors, a "cancelled on" date. Searchable. Anyone can resurrect a task (moves it back to unassigned in the stack).

---

## The Radar

The notification hub in the bottom-right corner. An SVG-based circular radar with an animated sweep line. When events happen (task picked, query raised, status updated), a ping ripples outward from the center. Clicking opens an activity drawer.

---

## More Visual Ideas

**Stack Pressure** — the stack feels heavier visually when backlog is large (cards overlap more). Lighter and more airy when nearly empty.

**Quick Reactions** — react to tasks with emoji (🔥 scary, 😅 unclear, 💡 excited). Shows as clusters on the card.

**Confetti on completion** — brief burst before the card slides off. Small thing, good feeling.

**Velocity River** — dashboard visual showing tasks completed over two weeks as a flowing river. Width = volume, color streams = task types.

---

## Technical Approach

**Web stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, Framer Motion for all animations, shadcn/ui as base, PostgreSQL + Prisma, Supabase Realtime for live updates, NextAuth.js for auth, Zustand for UI state, TanStack Query for server state.

**Embeddings:** OpenAI `text-embedding-3-small`. Vectors stored in Postgres using Supabase's `pgvector` extension. One vector per member (roles), one per task (title + description). Similarity queries run at the DB layer — fast.

**Realtime:** Supabase subscriptions on Task, TeamMember, and Query tables. Any DB change propagates automatically to subscribed clients. No manual event emitting.

**Sub-stacks are client-side:** Fetch all unassigned tasks once. Filter and sort for sub-stacks in the browser. No extra API call per type view.

---

## Cross-Platform Strategy (web → desktop → mobile)

**Right now: build the web app.** This is the right call. It's the fastest to build, easiest to iterate on, and gives you real user feedback before committing to more platforms.

**Desktop (when ready): Tauri.**
Tauri wraps your existing Next.js web app in a native shell. The result is a ~2MB binary on Mac/Windows/Linux. You write almost zero extra code — point Tauri at your Next.js build and you're done. No rewrite. No separate codebase. This is significantly better than Electron, which bundles an entire Chromium and results in 200MB+ apps. Tauri uses the OS's native webview instead.

**Mobile (when ready): React Native with Expo.**
Not Flutter. Here's why Flutter is the wrong choice for this project:
- You'd have to rewrite the entire app from scratch in Dart. All the component work, all the animation work — gone.
- Flutter web exists but is not good enough for a complex, animation-heavy app. You'd still need Next.js for the web version. Two completely separate codebases.
- React Native (Expo) shares your TypeScript types, your API layer, your business logic hooks. You build the mobile UI in React Native, but it talks to the exact same Next.js API endpoints. The learning curve is React patterns you already know.

**The principle:** Build the API layer in Next.js as a clean REST API from day one. Every route handler returns proper JSON. This means the web app, the Tauri desktop wrapper, and the future React Native mobile app all talk to the same backend without any changes to the server.

```
                    ┌─────────────┐
                    │  Next.js    │
                    │  API Routes │  ← single backend
                    └──────┬──────┘
           ┌───────────────┼──────────────┐
           ▼               ▼              ▼
    Next.js Web       Tauri Desktop    React Native
    (primary)         (wrap web app)   (mobile, v2)
```

---

## Pages Summary

| Route | What it is |
|-------|-----------|
| `/stack` | Master Stack + sub-stack views. The main page. |
| `/team` | Team grid. Everyone's current state. |
| `/tasks/[id]` | Task detail — description, DNA strip, activity, queries. |
| `/queries` | All open blockers and queries. |
| `/missions` | Goal stacks — personal and team missions. |
| `/graveyard` | Cancelled tasks. Tombstone view. |
