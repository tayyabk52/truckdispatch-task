# Dashboard Visual Refresh Design

## Goal

Refine the existing dashboard into a coherent, mobile-ready operational home screen. The visual direction borrows the reference image's soft canvas, compact typography, restrained purple emphasis, and composed desktop layout, but all content remains specific to trip planning and ELD work.

## Fixed Scope

- Keep the current storage query, metric calculations, recent-trip limit, route destinations, loading state, and empty state behavior unchanged.
- Do not add or remove dashboard functionality.
- Do not create new backend requests or data dependencies.

## Layout

### Desktop

Use a two-column dashboard grid. The primary column contains a compact welcome/action panel, the four existing metrics as a supporting tile grid, and the recent-trips surface. The secondary rail contains a derived trip snapshot using the existing aggregate values and a clear plan-trip action.

### Mobile

Collapse to one column. Lead with the action panel, use a two-column metric grid with roomy touch targets, place the summary after the metrics, and retain the recent trips as a full-width list. Avoid a fixed side rail or compressed desktop controls.

## Visual System

- Use pale, cool canvas layers and white content surfaces.
- Use purple only for selected emphasis and primary dashboard accents; retain semantic trip colors for status information.
- Reduce the feeling of disconnected cards by varying surfaces: one lead panel, quiet metric tiles, then one continuous activity list.
- Use compact labels, clear 1.125 to 1.2 type steps, and a single familiar sans-serif family.
- Prefer subtle borders and soft elevation over strong shadows or gradients.

## Components

- Update `DashboardPage` composition and page-local styling only.
- Reuse the existing `PageHeader`, `LoadingState`, `EmptyState`, and `TripHistoryItem` behavior.
- Extend shared presentation components only if required to make the dashboard visually coherent without changing their public behavior.

## Validation

- `npm.cmd run build` must pass.
- Check desktop and narrow mobile viewport layout in the browser.
- Confirm existing Plan Trip, View all, recent-trip links, loading state, and empty-state action still navigate as before.
