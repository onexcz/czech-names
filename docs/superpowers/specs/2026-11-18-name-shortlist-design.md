# Name shortlist ("Oblíbená jména") — design

## Intent
The owner is choosing a name for their child and wants to collect the names they like
while browsing, and rank them by preference. Personal use, one person, one browser.

## Goals
- Add a name to the shortlist: **drag** from the names grid on desktop, **tap a heart**
  on any device.
- **Reorder** the shortlist by dragging (most liked on top); remove with ×.
- Separate shortlists for boys and girls; the visible one follows the gender selector.
- Survives reloads: stored in `localStorage`.
- Names already shortlisted are visibly marked in the grid (filled heart).

## Non-goals
Sync between devices, sharing, accounts, backend, export, notes per name.

## Anti-goals
- Dragging must not fight page scrolling on a phone.
- The list must never be silently lost (bad JSON in storage → start empty, don't crash).

## Approaches
1. **SortableJS, ordered list (chosen by owner).** Handles mouse + touch drag, reorder and
   drag-in from the grid (`group: { pull: 'clone', put: false }`).
2. Native HTML5 drag-and-drop, unordered set — simpler, no dependency, but no touch
   drag and no reordering. Rejected: owner wants ranking.
3. No drag at all, tap + up/down buttons — works everywhere, but clunky on desktop.

## Design
**Layout (my call):**
- **Desktop (≥ 900 px):** names grid on the left, shortlist as a sticky panel on the
  right (~280 px).
- **Mobile:** a sticky bar at the bottom, "♥ Oblíbená (5)", that expands into the
  shortlist.

```
Desktop                                      Mobile
┌──────────── filters ──────────────┐        ┌───────────────┐
│ [ADAM ♡][ALEŠ ♥][BEDŘICH ♡] │ ♥ Oblíbená │        │ [ADAM ♡]      │
│ [CYRIL ♡][DAVID ♡] ...      │ 1 ⠿ ALEŠ  ×│        │ [ALEŠ ♥]      │
│  (drag tile → panel)        │ 2 ⠿ JAN   ×│        │ ...           │
│                             │ 3 ⠿ VÍT   ×│        ├───────────────┤
└─────────────────────────────┴────────────┘        │ ♥ Oblíbená (3)▲│
                                                    └───────────────┘
```

- **Reordering:** only by the ⠿ handle (Sortable `handle`), so on a phone a finger
  anywhere else still scrolls.
- **Desktop drag-in:** dropping a name from the grid inserts it at the drop position.
  Dropping a name that's already on the list moves it rather than duplicating it.
- **Storage:** key `czech-names:shortlist:v1` holds `{ "male": string[], "female": string[] }`.
- **Dependency:** SortableJS is used directly through a small Vue component or composable
  (my call). The Vue wrapper packages are unmaintained.
- **Text:** in Czech, matching the rest of the app: "Oblíbená jména", "Přetáhněte sem
  jména nebo klikněte na ♡".

## Left to the builder
Exact styling (follow the existing tile look), the breakpoint value, animation.
