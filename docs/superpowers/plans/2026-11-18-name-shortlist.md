# Name Shortlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ordered per-gender shortlist of liked names. Desktop: drag names in. Any device: tap a heart. Saved in localStorage.

**Architecture:** A pure, framework-agnostic store module (`src/shortlist.ts`) owns the list logic and persistence and is unit-tested with Vitest. A `ShortlistPanel.vue` component renders one gender's list and wires SortableJS for reorder and drop-in. `NamesList.vue` gets heart toggles and, on desktop, acts as a Sortable clone source. `App.vue` lays out the two-column (desktop) / bottom-bar (mobile) view.

**Tech Stack:** Vue 3 Options API (existing), TypeScript, SortableJS, Vitest (new dev dependency).

**Spec:** `docs/superpowers/specs/2026-11-18-name-shortlist-design.md`

## Global Constraints
- Storage key `czech-names:shortlist:v1`, value `{ "male": string[], "female": string[] }`.
- Reorder only via the `⠿` handle (Sortable `handle` option).
- Desktop breakpoint: `min-width: 900px`. Below that: sticky bottom bar "♥ Oblíbená (N)" that expands.
- Czech copy: panel title "Oblíbená jména", empty state "Přetáhněte sem jména nebo klikněte na ♡".
- No duplicates: adding an existing name moves it to the new position.

## Review Focus
- Corrupt or foreign JSON in localStorage → empty lists, no crash (test in Task 1).
- localStorage unavailable or throwing (private mode, quota) → app still works in memory (test in Task 1).
- Dropping a name from the grid that is already shortlisted → moved, not duplicated (test in Task 1: `insertAt` existing).
- After a grid→panel drop, Sortable's DOM clone must be removed so Vue's render stays the source of truth (manual check in Task 2: no doubled entries after drop).
- Switching gender while the mobile panel is open shows the other gender's list (manual check in Task 3).

---

### Task 1: Shortlist store

**Files:**
- Create: `src/shortlist.ts`, `src/shortlist.test.ts`
- Modify: `package.json` (add `vitest` devDependency, script `"test": "vitest run"`)

**Interfaces:**
- Produces:
  - `type Gender = 'male' | 'female'`
  - `type Shortlists = Record<Gender, string[]>`
  - `loadShortlists(storage?: Storage): Shortlists` (bad or missing data → `{male: [], female: []}`; filters out non-string entries)
  - `saveShortlists(lists: Shortlists, storage?: Storage): void` (swallows storage errors)
  - `insertAt(list: string[], name: string, index: number): string[]` (removes an existing copy first; clamps the index)
  - `move(list: string[], from: number, to: number): string[]`
  - `toggle(list: string[], name: string): string[]` (removes it if present, otherwise appends)
  - All list functions are pure and return new arrays.

- [ ] Step 1: Write tests: `load` with valid JSON, malformed JSON, `{"male":"x"}`, null storage, and storage whose `getItem` throws; `save` when `setItem` throws doesn't throw; `insertAt(['A','B','C'],'D',1)` gives `['A','D','B','C']`; `insertAt(['A','B','C'],'C',0)` gives `['C','A','B']`; `insertAt([], 'A', 99)` gives `['A']`; `move(['A','B','C'],0,2)` gives `['B','C','A']`; `toggle(['A'],'A')` gives `[]`; `toggle(['A'],'B')` gives `['A','B']`.
- [ ] Step 2: `npm test` → fails (module missing).
- [ ] Step 3: Implement `src/shortlist.ts`.
- [ ] Step 4: `npm test` → all pass; `npm run build` passes.
- [ ] Step 5: Commit.

### Task 2: ShortlistPanel + SortableJS

**Files:**
- Create: `src/components/ShortlistPanel.vue`
- Modify: `package.json` (add `sortablejs`, `@types/sortablejs`)

**Interfaces:**
- Consumes: `insertAt`, `move` from Task 1.
- Produces: `<ShortlistPanel :names="string[]" :gender="Gender" @update:names="(names: string[]) => void" />`. Renders numbered rows with a `⠿` handle and a × button. Its list element is a Sortable with `group: { name: 'names', put: true }` and `handle: '.handle'`.
  - `onUpdate`: emit `move(...)`.
  - `onAdd`: read the name from `evt.item.dataset.name`, remove `evt.item` from the DOM, emit `insertAt(names, name, evt.newIndex)`.

- [ ] Step 1: Implement. Destroy the Sortable in `beforeUnmount`.
- [ ] Step 2: `npm run build` passes.
- [ ] Step 3: Commit.

### Task 3: Grid hearts, drag source, layout, persistence wiring

**Files:**
- Modify: `src/components/NamesList.vue`, `src/App.vue`

**Interfaces:**
- Consumes: Task 1 store, Task 2 panel.
- `NamesList` new props: `liked: string[]`, `dragEnabled: boolean`; new emit `toggle(name: string)`. Each `li` gets `data-name`, a ♡/♥ button, and the class `liked` when the name is shortlisted. When `dragEnabled`, the `ul` becomes a Sortable with `group: { name: 'names', pull: 'clone', put: false }` and `sort: false`.
- `App`: `shortlists: Shortlists` loaded in `data()` from `loadShortlists()`, with a deep watcher calling `saveShortlists`. `isDesktop` comes from `matchMedia('(min-width: 900px)')` with a listener. Desktop: grid and sticky panel side by side. Mobile: fixed bottom bar with an expand toggle that shows the panel.

- [ ] Step 1: Implement.
- [ ] Step 2: `npm test && npm run build` pass.
- [ ] Step 3: Browser check with `vite preview`:
  - desktop width: drag a name in at position 2, drag the same name in again (moved, not doubled), reorder by handle, ×, reload (kept);
  - mobile width (≤ 600 px): heart toggle, bar count, expand, reorder by handle, switch gender.
- [ ] Step 4: Commit, push to `master`, verify the live deploy.
