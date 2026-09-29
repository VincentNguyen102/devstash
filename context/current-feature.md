# Current Feature

Dashboard UI Phase 3

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

See @context/features/dashboard-phase-3-spec.md

- Main content area (to the right)
- Recent collections
- Pinned items
- 10 recent items
- 4 stats cards at the top — counts for items, collections, favorite items, favorite collections (not in the screenshot)

## Notes

<!-- Any extra notes -->

- Phase 3 of 3 for the dashboard UI layout.
- Use the layout from `context/screenshots/dashboard-ui-main.png` as the visual reference.
- Data comes from `src/lib/mock-data.ts` (import directly for now until a database is implemented).

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 completed — ShadCN UI init + components, `/dashboard` route, dark mode by default, top bar with search & New Item button, sidebar/main placeholders
- Dashboard UI Phase 2 completed — collapsible sidebar, item type links to `/items/TYPE`, favorite & recent collections, user avatar area, drawer toggle, mobile drawer; sidebar moved into a shared `(dashboard)` route group layout with placeholder item/collection pages
