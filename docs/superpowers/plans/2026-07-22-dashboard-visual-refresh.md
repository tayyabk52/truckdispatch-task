# Dashboard Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recompose the existing dashboard into a reference-inspired, responsive dispatch workspace without changing its data, navigation, or actions. Do not touch or change the existing functionality, backend requests, or derived values. The plan is to recompose the page surface and its local styling only.

**Architecture:** Keep all derived trip values and route handlers in `DashboardPage`. Replace only the page composition and page-local MUI `sx` styling: a lead dispatch panel, quieter metric tiles, a responsive summary rail, and the existing recent-trip list. No storage, API, shared navigation, or route changes are allowed.

**Tech Stack:** React 19, TypeScript, Material UI 9, React Router 7, TanStack React Query.

## Global Constraints

- Preserve `useTripHistory`, all existing aggregate calculations, and `recent = trips.slice(0, 5)`.
- Preserve navigation to `/plan` and `/history`, and the existing `TripHistoryItem` links.
- Do not add dependencies, backend requests, or dashboard interactions.
- Use existing semantic state colors; use purple only as the dashboard accent.
- Keep the layout usable at 320 px wide, with visible focus styles inherited from MUI.

---

### Task 1: Recompose the dashboard surface

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Verify: `frontend/src/pages/DashboardPage.tsx`

**Interfaces:**
- Consumes: `useTripHistory(): { data?: TripHistoryEntry[]; isLoading: boolean }`, `useNavigate()`, `formatDuration(minutes: number): string`.
- Produces: the same default `DashboardPage` component, with unchanged runtime data and navigation behavior.

- [ ] **Step 1: Confirm the current implementation boundary**

Read `frontend/src/pages/DashboardPage.tsx` and confirm these expressions remain unchanged in the edited file:

```ts
const { data: trips = [], isLoading } = useTripHistory();
const totalTrips = trips.length;
const recent = trips.slice(0, 5);
```

- [ ] **Step 2: Build the lead dispatch panel**

Replace the current page-header-only opening with a responsive content grid. The primary panel should use a restrained purple surface, display the existing dashboard title and subtitle, and retain the same Plan Trip click handler:

```tsx
<Button
  variant="contained"
  startIcon={<AddRoad />}
  onClick={() => navigate("/plan")}
>
  Plan trip
</Button>
```

Use a decorative route-line treatment made from CSS-only `Box` elements, with `aria-hidden`, so it does not introduce a new control or data dependency.

- [ ] **Step 3: Convert the KPIs into supporting metric tiles**

Keep each existing value, icon, label, unit, help text, and semantic color. Render the four values as a two-column mobile grid that becomes four columns in the primary desktop column. The tiles must be quieter than the lead panel and avoid nested elevated cards.

- [ ] **Step 4: Add the derived summary rail**

Render a non-interactive desktop summary rail from the existing totals: total trips, miles planned, driving time, and daily logs. On narrow screens this rail must render after the metric tiles in the single-column flow. It must not compute new values, call new hooks, or create routes.

- [ ] **Step 5: Restyle the recent-trip region without changing its states**

Keep the existing loading branch, empty-state branch, `recent.map`, and View all route. Present the list in one continuous white surface with a compact section heading and divider rhythm. Do not edit `TripHistoryItem` or its behavior.

- [ ] **Step 6: Compile the implementation**

Run:

```powershell
npm.cmd run build
```

Expected: exit code `0`, with TypeScript and Vite both completing. A bundle-size advisory is allowed; TypeScript errors are not.

### Task 2: Check responsive and interaction preservation

**Files:**
- Verify: `frontend/src/pages/DashboardPage.tsx`
- Verify: `frontend/src/components/layout/AppLayout.tsx`

**Interfaces:**
- Consumes: the page component produced by Task 1 and its existing application shell.
- Produces: evidence that the redesign does not obstruct the existing dashboard workflow.

- [ ] **Step 1: Start the frontend locally**

Run:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Expected: Vite serves the app locally without compile errors.

- [ ] **Step 2: Check the desktop composition**

At a 1440 px viewport, confirm the lead panel, metrics, recent-trip surface, and summary rail form a clear two-column composition. Confirm Plan trip navigates to `/plan` and View all navigates to `/history`.

- [ ] **Step 3: Check the mobile composition**

At a 320 px viewport, confirm the app has one content column, two readable metric tiles per row, no horizontal page scroll, and full-width or comfortably tappable primary action controls.

- [ ] **Step 4: Run final production verification**

Run:

```powershell
npm.cmd run build
```

Expected: exit code `0`.
