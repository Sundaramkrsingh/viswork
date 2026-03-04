# Viswork — Feature Specifications

## Task Types & Colors

| Type      | Color        | Hex       | Description                          |
|-----------|--------------|-----------|--------------------------------------|
| feature   | Blue         | `#3B82F6` | New functionality                    |
| bug       | Red          | `#EF4444` | Something broken                     |
| refactor  | Purple       | `#8B5CF6` | Code improvement, no new behavior    |
| chore     | Amber        | `#F59E0B` | Setup, config, maintenance           |
| spike     | Cyan         | `#06B6D4` | Research / investigation             |
| design    | Pink         | `#EC4899` | UI/UX work                           |

These colors are fixed. Use them as Tailwind custom colors and CSS variables.

---

## Task Weight

| Weight | Label | Visual          | Story Points (guideline) |
|--------|-------|-----------------|--------------------------|
| XS     | Tiny  | 1 dot           | <1 hour                  |
| S      | Small | 2 dots          | Half day                 |
| M      | Medium| 3 dots          | 1–2 days                 |
| L      | Large | 4 dots          | 3–5 days                 |
| XL     | Epic  | 5 dots + pulse  | >5 days (should be split)|

XL tasks should visually suggest they need to be broken down (pulsing weight indicator + tooltip warning).

---

## Task Status Flow

```
unassigned → in_progress → in_review → done
                ↓               ↓
             blocked          done
                ↓
           in_progress (unblocked)

Any status → cancelled → [Graveyard]
```

**Status Visual Mapping:**

| Status      | Card Left Border Color | Badge         |
|-------------|------------------------|---------------|
| unassigned  | Gray                   | "Open"        |
| in_progress | Green (animated)       | "Active"      |
| in_review   | Yellow                 | "Review"      |
| blocked     | Red + chain icon       | "Blocked"     |
| done        | — (leaves stack)       | —             |
| cancelled   | — (goes to graveyard)  | —             |

---

## Expertise Roles (Custom, Free-Text)

There are no fixed system roles. Each member has a list of custom expertise tags they set and order themselves. The order is their proficiency ranking — first tag is their primary expertise.

Example: `["React", "TypeScript", "Node.js", "GraphQL"]`

**Avatar ring color:** Derived from the primary (first) expertise tag via a deterministic hash of the tag string → maps to a hue. Same tag always produces the same color across the app. This means two "React" specialists have the same ring color without any hardcoding.

```typescript
// lib/utils.ts
export function expertiseToHue(tag: string): number {
  let hash = 0
  for (const char of tag.toLowerCase()) hash = char.charCodeAt(0) + ((hash << 5) - hash)
  return Math.abs(hash) % 360
}
// Usage: `hsl(${expertiseToHue(member.expertiseRoles[0])}, 70%, 60%)`
```

**Visual rendering of expertise tags on member card:**
- Tag 1 (primary): full size, full opacity, colored background chip
- Tag 2: slightly smaller, 80% opacity
- Tag 3: smaller still, 60% opacity
- Tags 4+: collapsed behind a `+N more` chip

This immediately communicates depth of expertise — you can see at a glance who's a specialist vs generalist.

---

## Availability Status

Set by the team member themselves (quick toggle from their avatar):

| Status       | Visual                        | Meaning                            |
|--------------|-------------------------------|------------------------------------|
| available    | Green pulse ring              | Ready to pick up tasks             |
| in_progress  | Animated spinner ring         | Actively working                   |
| in_review    | Yellow ring                   | Waiting on review / semi-available |
| flow_state   | Animated aura + timer         | Deep work, don't interrupt          |
| away         | Gray ring                     | OOO / offline                      |

---

## The Master Stack — Component Breakdown

### StackView (`/app/(app)/stack/page.tsx`)
- Full-page view
- Left panel: The Stack (60% width)
- Right panel: Quick team pulse (40% width) — who's doing what right now
- Top bar: Stack stats (total tasks, by type, avg age)
- Sub-stack filter tabs just below top bar

### StackFilterTabs (`/components/stack/StackFilterTabs.tsx`)
The type-view switcher. Sits above the stack list.

```
[ All (12) ]  [ Bugs (4) ]  [ Features (5) ]  [ Refactors (2) ]  [ Chores (1) ]
```

- Each tab has the type's brand color as an underline/dot when active
- Count badge reflects unassigned tasks of that type only
- "All" tab is always first
- Selecting a tab animates — cards of filtered-out types slide out (exit down), relevant cards snap to position
- Active tab is highlighted; inactive tabs are subtly present (not hidden)
- Tabs with 0 tasks are dimmed but still shown so you know the category exists

State: `activeFilter: TaskType | 'all'` — stored in URL param (`?type=bug`) so it's shareable/linkable

### StackList (`/components/stack/StackList.tsx`)
The actual ordered list of cards. Takes `tasks` (already filtered + sorted) as props.

- Uses Framer Motion `AnimatePresence` + `layoutId` so items animate position when filter changes
- Cards maintain their rank number from the GLOBAL master stack (not re-numbered per filter)
  - e.g., in bug sub-stack you might see rank #1, #3, #7 — because the other ranks are features/refactors
  - This keeps the rank number meaningful and consistent across views
- Blocked tasks (open blocking query) shown with reduced opacity + chain icon, skippable

### TaskCard (`/components/stack/TaskCard.tsx`)
Props: `task`, `suggestedAssignees`, `rank` (global rank in master stack)

Visual layers (bottom to top):
1. Card background (dark, slightly rounded)
2. Left accent bar (task type color, full height)
3. Card content: rank number, title, type badge, weight dots
4. Bottom row: age pill, signal clarity, assignee suggestions
5. Heat overlay (transparent → warm amber → hot red based on age)
6. Hover state: slight lift + shadow

### AssigneeSuggestionChips (`/components/stack/AssigneeSuggestionChips.tsx`)
- Shows top 3 suggested assignees
- Click to assign
- Each chip: avatar + name + availability ring
- Tooltip on hover shows current task (if busy)

### StackOrderPanel (`/components/stack/StackOrderPanel.tsx`)
Manager-only. Two-section panel:

**Section 1 — Type Order** (global)
- Drag to reorder types: which type group floats to the top of master stack
- e.g., drag `bug` above `feature` → all bugs appear before all features in master stack
- Visual: draggable type pills with color dots

**Section 2 — Within-Type Order** (per sub-stack)
- Type selector (tabs matching the stack filter tabs)
- Shows tasks of selected type in their current within-type order
- Drag to reorder within the type
- This order feeds directly into the sub-stack view and into the master stack (within that type's slot)
- Also shows a "pin to top" button to override all ordering for a specific task

---

## Team Overview Page — Component Breakdown

### TeamPage (`/app/(app)/team/page.tsx`)
- Grid of MemberCards
- Filter by role, availability status
- "Who's available right now" section at top

### MemberCard (`/components/team/MemberCard.tsx`)
Props: `member`, `currentTask`, `activeQueries`

Visual:
- Large avatar (80px) with expertise-derived ring color + availability animation
- Name
- Expertise tags: primary tag full-size, secondary progressively smaller/faded, overflow as `+N`
- Current task pill (type color + truncated title)
- Query badge (red dot if they have open queries to respond to)
- Flow state aura if active (animated purple glow + countdown)
- Click → expands to show last 3 completed tasks

**Expertise tag editing (inline on member's own card):**
- Click "Edit roles" → tags become draggable chips
- Drag to reorder (changes expertise priority)
- Click `+` to add a new tag (free text input)
- Click `×` on a tag to remove
- Save → triggers role vector recomputation in background

---

## Query System — Component Breakdown

### QueryCard (`/components/queries/QueryCard.tsx`)
Props: `query`, `associatedTask`, `taggedMembers`

Visual:
- Icon: chain link (blocking) or `?` circle (non-blocking)
- Associated task pill with type color
- Query text
- Tagged member avatars
- Age pill
- Action buttons: "Mark Resolved" / "Reply"

### QueryBoard (`/app/(app)/queries/page.tsx`)
- Two columns: Blocking | Non-blocking
- Sorted by age (oldest first = most urgent)
- Filter by: "My queries" / "Tagged in me" / "All"

### QueryComposer (modal/drawer)
- Raise from within any task detail
- Type the query
- Tag people (searchable member list)
- Toggle: Blocking / Non-blocking
- Auto-links to current task

---

## Missions — Component Breakdown

### MissionsPage (`/app/(app)/missions/page.tsx`)
Two-column layout:
- Left (35%): MissionList — personal missions, then team missions
- Right (65%): MissionDetail — the selected mission's stack view
- "New Mission" button (top right of left panel)

### MissionList (`/components/missions/MissionList.tsx`)
- Two sections: "Personal" and "Team" with a divider
- Each entry: MissionListItem showing title, progress bar, deadline countdown
- Active mission highlighted
- Missions sorted by deadline (soonest first within each section)

### MissionListItem (`/components/missions/MissionListItem.tsx`)
Props: `mission`, `isActive`

Visual:
- Title
- Progress bar: thin colored bar (fills green as items complete)
- Deadline chip: "3 days left" (amber at <3 days, red at <1 day)
- Small avatar cluster for team missions (participants)
- Personal missions: faint person icon
- Victory state: gold border + checkmark
- Miss state: faded with strikethrough deadline

### MissionDetail (`/components/missions/MissionDetail.tsx`)
The right-panel mission view.

**Header:**
- Mission title (editable inline)
- Personal / Team badge
- Deadline + "X days left" countdown
- Timeline bar: full-width bar that fills up as deadline approaches (runs out, not fills in — shows urgency visually)
- Progress summary: "5 of 8 items done"

**Mission Stack:**
- List of mission items (MissionItemCard)
- Empty state: "Add tasks from the stack or create standalone targets"
- "Add items" button: opens AddToMissionDrawer

### MissionItemCard (`/components/missions/MissionItemCard.tsx`)
Two variants:

**Linked task variant:**
- Left accent bar uses task type color (same as main stack card)
- Title + type badge
- Stack rank badge: "#3 in stack" — small chip
- Live status pill: in_progress / in_review / done (pulled from task)
- Assignee avatar (if assigned)
- When task marked done in main stack → this card plays exit animation and disappears from mission

**Standalone target variant:**
- Simpler card, no accent bar color (neutral gray-left border)
- Checkbox (large, satisfying click)
- Text (editable inline)
- No rank badge, no type badge
- Check → card exits with a tick animation

### AddToMissionDrawer (`/components/missions/AddToMissionDrawer.tsx`)
Slide-in drawer from the right.

Two tabs:
1. **"From Stack"** — shows unassigned + in-progress tasks from main stack, sorted by global rank. Click to link.
2. **"New Target"** — simple text input, press Enter to add a standalone target.

Search bar at top (filters both tabs).

### MissionCreateModal (`/components/missions/MissionCreateModal.tsx`)
Simple modal:
- Title input
- Deadline picker (date + optional time)
- Toggle: Personal / Team
- Optional description
- Create → immediately opens MissionDetail so you can start adding items

### Animations for Missions

**Mission item completion (linked task done):**
```
exit: { opacity: 0, x: 60, transition: { duration: 0.35 } }
// before exit: brief green flash on the card
```

**Standalone target check:**
```
// checkbox fills with a draw-on SVG checkmark
// card: opacity 0 + scale 0.95 + x: 40 exit
```

**Victory state (all items done before deadline):**
```
// Full mission header animates: border → gold, title gets a crown icon
// canvas-confetti burst (gold + team color)
// Toast: "Mission complete! 🎯 [Title] — finished with X days to spare"
```

**Miss state (deadline passes, items remain):**
```
// Timeline bar turns red and "empties" (reverse fill animation)
// Remaining items dim to 50% opacity
// Deadline chip changes to "Missed by X days"
// No tombstone drama — just a quiet visual shift
```

**Timeline bar urgency animation (< 1 day left):**
```
animate: { opacity: [1, 0.6, 1] }
transition: { repeat: Infinity, duration: 1.5 }
// Bar color transitions: blue → amber (< 3 days) → red (< 1 day)
```

---

## Graveyard — Component Breakdown

### GraveyardPage (`/app/(app)/graveyard/page.tsx`)
- Dark desaturated background (differentiated from main app)
- Task cards styled as tombstones:
  - Slightly tilted variants (random small rotation per card)
  - Faded type colors
  - "RIP" date shown
- Search and filter by type, date range
- "Resurrect" button (manager only): moves task back to unassigned in stack

---

## The Radar (Notification Hub)

### RadarWidget (`/components/ui/RadarWidget.tsx`)
- Fixed position bottom-right corner
- SVG-based circular radar with animated sweep line
- Events cause ping animations (ripple circles from center)
- Click to open activity drawer
- Shows: task picks, status updates, query raises, query resolutions
- Real-time via Supabase/socket subscription

---

## Flow State — UX Flow

1. User clicks their avatar in header → quick menu appears
2. Menu shows: "Enter Flow State" with time options (25m / 60m / custom)
3. On activate:
   - Their availability status → `flow_state`
   - Header avatar shows animated aura
   - All team members see the timer on their MemberCard
   - Stack suggestion logic deprioritizes them
4. When timer ends OR user manually exits:
   - Brief "Flow ended" toast
   - Status returns to previous state

---

## Task Heat Thresholds

```typescript
function getTaskHeat(createdAt: Date): 'cool' | 'warm' | 'hot' {
  const daysOld = differenceInDays(new Date(), createdAt)
  if (daysOld < 3) return 'cool'
  if (daysOld < 7) return 'warm'
  return 'hot'
}
```

| Heat  | Visual Effect                                    |
|-------|--------------------------------------------------|
| cool  | Normal card, no overlay                          |
| warm  | Amber glow border, amber age pill                |
| hot   | Red pulsing border animation, red age pill, subtle shake on hover |

---

## Signal Clarity Score

Computed client-side from task data:

```typescript
function getSignalScore(task: Task): 1 | 2 | 3 | 4 {
  let score = 1
  if (task.description && task.description.length > 50) score++
  if (task.weight) score++
  if (task.links?.length || task.acceptanceCriteria) score++
  return score as 1 | 2 | 3 | 4
}
```

Visual: 4 small vertical bars, filled bars = score. Like WiFi signal icon.

---

## Animations Reference (Framer Motion)

### Card Enter (stack)
```
initial: { opacity: 0, y: -20 }
animate: { opacity: 1, y: 0 }
transition: { type: 'spring', stiffness: 300, damping: 30 }
```

### Card Exit (task done)
```
exit: { opacity: 0, scale: 1.05, y: -10 }
// followed by confetti burst before exit
```

### Stack Reorder
```
layout: true
layoutId: task.id  // Framer Motion auto-animates position changes
```

### Card Heat Pulse (hot tasks)
```
animate: { boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 8px rgba(239,68,68,0.4)', '0 0 0 0 rgba(239,68,68,0)'] }
transition: { repeat: Infinity, duration: 2 }
```

### Flow State Aura
```
animate: {
  boxShadow: ['0 0 20px 4px rgba(167,139,250,0.3)', '0 0 40px 8px rgba(167,139,250,0.5)', '0 0 20px 4px rgba(167,139,250,0.3)']
}
transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
```

### Confetti Burst
Use `canvas-confetti` package. Trigger on task completion before card exits.

---

## Permissions

**MVP: No access restrictions. Everyone can do everything.**

There are no manager/engineer permission gates in the MVP. Any team member can reorder the stack, cancel tasks, assign work, resurrect from graveyard, create missions, etc. Small trusted teams don't need access control — they need speed and clarity.

The only personal ownership boundary:
- You can only edit **your own** expertise roles (not someone else's)
- You can only activate/deactivate **your own** Flow State

Everything else is open to all team members.
