# Viswork — Product Requirements Document

## Vision
A visual-first, opinion-heavy project management tool for small engineering teams.
**Not another Jira. Not another Trello.**

The bet: small teams move faster when they have one shared visual truth about what to work on next — enforced by a queue, not a board.

---

## The Core Problem
Small teams waste energy on:
1. "What should I work on next?" — no clear priority
2. "Who's doing what?" — no live visibility
3. "Who's blocking me?" — queries get lost in Slack
4. Boring tools that feel like admin work

Viswork solves all four visually and with minimal friction.

---

## Target Users
- Engineering teams of 2–15 people
- Teams that move fast and hate process overhead
- Teams that value clarity over ceremony
- One "stack manager" (lead/manager) + engineers + optionally a PM

---

## MVP Scope

### 1. The Master Stack + Type Sub-Stacks

#### Mental Model: One Queue, Multiple Lenses
There is only one source of truth — the master stack. Sub-stacks (bug stack, feature stack, etc.) are **type-filtered views** of the same data, not separate queues. A task exists in exactly one place. Picking from any view is the same action — no sync needed, no duplication possible.

```
Master Stack (all tasks, global priority order)
    ├── Bug Sub-Stack    (filter: type=bug,    sorted by bug priority)
    ├── Feature Sub-Stack(filter: type=feature, sorted by feature priority)
    ├── Refactor Sub-Stack ...
    └── ...
```

#### The Master Stack
The default central view. A vertical, prioritized queue of all unassigned tasks.

**What it is:**
- A visual stack of task cards, sorted by manager-set global priority
- Engineers always pick from the top — this is not negotiable in the UI
- Cards are color-coded by task type
- Task types: `feature`, `bug`, `refactor`, `chore`, `spike`, `design`

**Task card shows:**
- Task title
- Type badge (colored)
- Weight indicator (S / M / L / XL shown as dot clusters or a bar)
- Age indicator — how long this has been in the stack (gets visually "hotter" over time)
- Assignee suggestion chips (see Smart Suggestions below)
- Signal clarity icon — how well-defined is this task?

**Stack ordering — two layers:**
- **Layer 1 — Type order**: manager sets which types come first globally (e.g., bugs always before features). This controls the master stack's interleaving.
- **Layer 2 — Within-type order**: manager can reorder within a type (bug #1 before bug #2). This is managed via sub-stacks, and feeds into the master stack.
- Manager can also manually pin any task to absolute top, overriding all rules.
- Ordering changes animate smoothly (Framer Motion `layoutId`).

#### Sub-Stacks (Type Views)
Engineers can toggle from "All" (master stack) to a specific type lane.

**Why this is useful:**
- A frontend engineer mostly cares about `feature`, `design`, `refactor` — not `chore` or `devops` tasks they can't work on anyway
- Manager gets a focused view to prioritize within a type without seeing noise from other types
- Sub-stack top = the highest priority task of that type — which is also where it sits in the global master stack

**Sub-stack UI:**
- Toggle bar at the top of the stack view: `All | Bugs | Features | Refactors | Chores | Spikes | Design`
- Active filter highlighted with the type's color
- Count badge on each type tab (e.g., "Bugs (4)")
- Switching views animates — cards of other types slide out, filtered cards snap to position
- The stack header shows the active filter name and a "return to All" breadcrumb

**Role-based default view:**
- When an engineer first opens the stack, the default filter is pre-set to their role's relevant types
- Frontend dev → defaults to `feature + design + refactor`
- Backend dev → defaults to `feature + bug + refactor + chore`
- This is a preference, not a lock — they can always switch to All
- Manager always defaults to All

**Picking discipline still holds:**
- Even in a sub-stack view, the engineer must pick from the top of that filtered list
- The UI does not allow picking task #3 while #1 and #2 are unassigned and unblocked
- Exception: if a task is `blocked` (has open blocking query), the next task becomes pickable

**Task statuses:**
- `unassigned` — sitting in stack
- `in_progress` — being worked on
- `in_review` — PR up / code review
- `blocked` — has an open query
- `done` — completed (leaves the stack with a celebration)
- `cancelled` — sent to the Graveyard

---

### 2. Smart Assignee Suggestions
Each task at the top of the stack shows suggested names.

**Logic:**
- If a team member has no current task → shown as primary suggestion (green glow)
- If a team member is `in_review` (waiting on feedback) → shown as secondary (yellow, "can pick up soon")
- If a team member is `in_progress` (actively working) → shown last with a "busy" indicator (dimmed, shows what they're on)
- Role matching: frontend tasks suggest frontend devs first

**Visual:**
- Avatar chips below the task card
- Green ring = available
- Yellow ring + small spinner = in review / semi-available
- Gray ring + miniature task pill = busy (shows what they're working on on hover)

---

### 3. Team Overview Page
A single page showing all team members and their current state.

**Each member card shows:**
- Avatar (large, with role-color ring)
- Name + role
- Current task pill (color-coded by type)
- Status: Available / In Progress / In Review / Away
- Availability status set by the member themselves

**Visual ideas:**
- Cards arranged in a grid
- Active members pulse subtly
- Members in "deep work" (set by themselves) show a "do not disturb" aura with a countdown timer
- Members who haven't been active in >1 day show a "last seen X ago" indicator

---

### 4. Task Detail Page
Accessed by clicking any task card.

**Shows:**
- Full task description (markdown supported)
- Type, weight, status, assignee
- Timeline strip: visual horizontal bar showing task lifecycle (created → assigned → in progress → done)
- Activity log: who changed what and when (visual, not just a text list)
- Open queries/blockers section
- Linked tasks (blocked by / blocks)
- File/link attachments

---

### 5. Queries & Blockers
A lightweight way to raise a question or blocker against a task.

**What it is:**
- A query is raised from within a task
- It tags one or more people who need to respond
- Queries show up prominently for tagged people — on their profile and as a badge on the task card
- A query can be marked `blocking` (task cannot progress) or `non-blocking` (just needs info)

**Visual:**
- Blocking queries show a chain-link icon on the task card
- Non-blocking queries show an `?` badge
- Tagged people see a query inbox on their team member card
- The query board shows all open queries sorted by age

---

### 6. The Graveyard
Where cancelled tasks go.

**Visual:**
- Dark, desaturated view
- Tasks shown as tombstone-style cards with the date they were cancelled
- Searchable and filterable
- Can be resurrected (moved back to stack) by a manager

---

### 7. Missions (Goal Stacks)

#### The Core Idea
A Mission is a timed container you fill with intent and race to empty.

It is **not** a second task management system. Missions sit above the main stack as the **intent layer** — why are we doing this work? The main stack is the **execution layer** — what are we doing right now?

```
Missions (intent)     →    what we're trying to achieve by when
Main Stack (execution) →   the strict pull queue that gets us there
```

#### Two Layers: Stack Tasks + Standalone Targets

A mission holds two kinds of items:

1. **Linked tasks** — references to real tasks in the main stack. Completing the task in the main stack auto-clears it from the mission. No duplication. The task card in the mission shows its live status (in_progress, in_review, done).

2. **Standalone targets** — lightweight checkboxes for things that aren't engineering tasks: "write API docs", "review PR #42", "sync with design". These live only in the mission, not in the main stack.

This means: a mission item is either a pointer to a task OR a simple to-do. Never a copy of a task.

#### Personal vs Team Missions

| Type    | Who sees it     | Who creates it | Use case                                |
|---------|-----------------|----------------|-----------------------------------------|
| Personal| Only you        | Anyone         | "My goals for this week"                |
| Team    | Whole workspace | Anyone         | "Zero critical bugs by Friday"          |

A task can appear in multiple missions simultaneously (it's just a reference). No conflict.

#### The Emptying Mechanic
- Fill the mission with items. Race to empty it by the deadline.
- Timeline bar at the top shows time remaining. It fills up as the deadline approaches (like a loading bar running out).
- Items complete → they animate off the mission stack (slide + fade, satisfying).
- **Victory state**: all items done before deadline → full-screen celebration, mission card glows gold.
- **Miss state**: deadline passes with items remaining → mission dims, remaining items shown in a "what we didn't finish" state. Not a tombstone — lessons, not shame.

#### Integration with the Main Stack
- From any task card in the main stack: "Add to Mission" action (dropdown → pick which mission)
- From a mission view: "Link from Stack" drawer — shows unassigned + in-progress tasks you can pull into this mission
- Mission items that are linked tasks show a small stack-rank badge (e.g., "#3 in stack") so you know where they sit in execution priority
- Completing all linked tasks for a mission doesn't change their stack behavior — a task doesn't get reprioritized because it's in a mission. Stack discipline stays intact.

#### Mission Card (in mission list view)
- Title + deadline
- Progress bar: X of Y items done
- Timeline bar: time remaining
- Type breakdown: X linked tasks, Y standalone targets
- Team vs personal badge
- Participants (for team missions): avatars of members who have linked tasks in this mission

#### Missions Page Layout
- Left: mission list (personal missions at top, team missions below)
- Right: selected mission detail — the mission stack view
- The mission stack looks similar to the main stack but:
  - Lighter visual treatment (no heat, no suggestions — just status)
  - Linked tasks show live status pulled from the main stack
  - Standalone targets show as simpler checkbox-style cards

#### What Missions Are NOT
- Not sprints (no formal sprint ceremonies)
- Not project milestones (no dependency graphs)
- Not a second queue (missions don't control what engineers pick next — that's still the main stack)
- Not mandatory (skip them entirely if you don't want them)

---

## Creative Features (beyond basics)

### Task Heat
Tasks that sit in the stack too long without being picked get progressively "hotter":
- 0–2 days: normal
- 3–5 days: slight warm glow (amber border)
- 6+ days: hot (red pulsing border + subtle shake animation on hover)
This is visual pressure to pick up old tasks.

### Flow State Mode
An engineer can activate "Flow State" on their profile:
- Sets a timer (25min / 60min / custom)
- Their avatar shows an animated aura (like a soft glowing ring with particles)
- Other team members see a tooltip: "In flow until 3:45 PM"
- They still appear as "available" but the visual cues show "don't break focus"
- Stack suggestion de-prioritizes assigning new tasks to them during flow

### Task DNA Strip
Every task card (in detail view) shows a compact horizontal timeline:
- Thin colored bar showing time spent in each status
- Hover shows exact dates
- This builds institutional memory about how long things actually take

### Velocity River (Dashboard)
A visual flowing diagram on the main dashboard:
- Shows tasks completed over the last 2 weeks as a river
- Width of river = number of tasks completed per day
- Color streams = task types
- Gives a felt sense of team momentum

### Confetti Moments
When a task is marked `done`:
- The card briefly celebrates (confetti burst, card glows green)
- Then slides off the stack smoothly
- Team member who completed it gets a subtle "nice work" toast

### Signal Clarity Score
Each task card shows signal strength bars (like WiFi bars):
- 1 bar: title only (poorly defined)
- 2 bars: has description
- 3 bars: has description + weight
- 4 bars: has description + weight + links/acceptance criteria
Encourages better task definitions without making it mandatory.

### Stack Pressure Indicator
A subtle visual on the stack overview:
- If stack has >15 tasks: stack cards physically overlap more / look "heavy"
- If stack is 0–5 tasks: cards have more breathing room, lighter feel
Gives immediate visual feedback on backlog health.

### Quick Reactions on Tasks
Engineers can add emoji reactions to tasks (like 🔥 for hairy, 😅 for unclear, 💡 for excited):
- Shows on the card as small emoji clusters
- Not a rating system — just team expression
- Helps managers see morale/complexity signals

### The Radar (Notification Hub)
Instead of a boring notification bell:
- A circular radar-style visual in the corner
- Pings animate outward from center when new events happen
- Clicking opens a feed of recent activity: "Ravi picked up BUG-12", "Priya raised a query on FEAT-08"

### Sprint Snapshot (End of Sprint)
At the end of a sprint/week, generate a visual "sprint card" — like a year-in-review poster:
- Tasks completed (count + types as colored pie)
- Top contributors
- Avg task age
- Share as an image

---

## What's NOT in MVP
- Time tracking
- Billing / invoicing
- External stakeholder access
- Roadmaps / milestones
- Notifications via email/Slack (v2)
- Mobile app (v2)
- Custom task types (v2)
- AI-generated task descriptions (v2)
