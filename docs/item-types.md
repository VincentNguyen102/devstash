# Item Types

**Last Updated**: 2026-10-02
**Scope**: The 7 built-in (system) item types in DevStash — snippets, prompts, commands, notes, files, images and links.
**Sources**: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/item-type-meta.ts`, `src/lib/mock-data.ts`, `src/lib/db/{items,collections,profile}.ts`, `context/project-overview.md`.

> **Source note**: the research prompt lists `src/lib/constants.tsx`, which no longer exists. The equivalent definitions live in two places: the canonical seed rows (name / icon / hex colour) in `prisma/seed.ts` and the presentation visuals (icon component + Tailwind colour classes) in `src/lib/item-type-meta.ts`. Both are covered below.

---

## Overview

An **item** is a single piece of developer knowledge. Every item has one `typeId` pointing at an `ItemType` row. The 7 system types are seeded with stable slug ids, so `/items/{id}` routes and the shared visual map keep working even though the data is database-backed.

| Id | Name | Icon (Lucide) | Hex colour | Purpose | Primary content fields |
| --- | --- | --- | --- | --- | --- |
| `snippet` | Snippets | `CodeXml` | `#60a5fa` | Reusable source code, usually syntax-highlighted | `content`, `language` |
| `prompt` | Prompts | `Sparkles` | `#a78bfa` | Reusable AI prompts / instructions | `content` |
| `command` | Commands | `Terminal` | `#fb923c` | Shell / terminal commands and one-liners | `content`, `language` (typically `bash`) |
| `note` | Notes | `StickyNote` | `#facc15` | Free-form Markdown notes and documentation | `content` |
| `file` | Files | `File` | `#94a3b8` | Uploaded files: docs, templates, configs (Pro) | `fileUrl`, `fileName`, `fileSize` |
| `image` | Images | `Image` | `#f472b6` | Uploaded images (marked Pro in the UI) | `fileUrl`, `fileName`, `fileSize` |
| `url` | Links | `Link` | `#4ade80` | External bookmarks and documentation links | `url` |

Canonical display order (`SYSTEM_TYPE_ORDER`): `snippet`, `prompt`, `command`, `note`, `file`, `image`, `url`. Unknown / custom types sort last.

---

## Per-Type Detail

### Snippet — `snippet`

- **Icon**: `CodeXml` · **Hex**: `#60a5fa` (blue) · **UI classes**: `text-blue-400`, `bg-blue-400/10`, `ring-blue-400/40`
- **Purpose**: Store reusable source code with syntax highlighting.
- **Key fields**: `content` (the code), `language` (e.g. `typescript`, `tsx`, `python`, `dockerfile`), plus shared metadata.
- **Seed examples**: _Custom React Hooks_, _Component Patterns_, _Utility Functions_, _Multi-stage Dockerfile_ — all with `language` set.

### Prompt — `prompt`

- **Icon**: `Sparkles` · **Hex**: `#a78bfa` (violet) · **UI classes**: `text-violet-400`, `bg-violet-400/10`, `ring-violet-400/40`
- **Purpose**: Store reusable AI prompts / instructions.
- **Key fields**: `content`. No `language` (not code).
- **Seed examples**: _Code Review Prompt_, _Documentation Generation Prompt_, _Refactoring Assistance Prompt_.

### Command — `command`

- **Icon**: `Terminal` · **Hex**: `#fb923c` (orange) · **UI classes**: `text-orange-400`, `bg-orange-400/10`, `ring-orange-400/40`
- **Purpose**: Store shell / terminal commands.
- **Key fields**: `content`, `language` (seeded as `bash`).
- **Seed examples**: _Deployment Script_, _Git Operations_, _Docker Cleanup_, _Process Management_, _Package Manager Utilities_.

### Note — `note`

- **Icon**: `StickyNote` · **Hex**: `#facc15` (yellow) · **UI classes**: `text-yellow-400`, `bg-yellow-400/10`, `ring-yellow-400/40`
- **Purpose**: Free-form Markdown notes and documentation.
- **Key fields**: `content`.
- **Seed examples**: none. The seed data contains no `note` items (see Coverage below).

### File — `file`

- **Icon**: `File` · **Hex**: `#94a3b8` (slate) · **UI classes**: `text-slate-400`, `bg-slate-400/10`, `ring-slate-400/40`
- **Purpose**: Uploaded files — docs, templates, configs. **Gated as Pro** in the sidebar (`PRO_TYPE_IDS` in `src/components/dashboard/sidebar.tsx`).
- **Key fields**: `fileUrl`, `fileName`, `fileSize` (storage on Cloudflare R2 per the project spec). `content` is not used.
- **Seed examples**: none — no file items are seeded, and no upload UI exists yet.

### Image — `image`

- **Icon**: `Image` (imported as `ImageIcon`) · **Hex**: `#f472b6` (pink) · **UI classes**: `text-pink-400`, `bg-pink-400/10`, `ring-pink-400/40`
- **Purpose**: Uploaded images. **Gated as Pro** in the sidebar, although `context/project-overview.md` lists "image uploads" under the Free tier (see Observations).
- **Key fields**: `fileUrl`, `fileName`, `fileSize`. `content` is not used.
- **Seed examples**: none — no image items are seeded, and no upload UI exists yet.

### Link / URL — `url`

- **Icon**: `Link` (imported as `LinkIcon`) · **Hex**: `#4ade80` (green) · **UI classes**: `text-green-400`, `bg-green-400/10`, `ring-green-400/40`
- **Purpose**: External bookmarks and documentation links.
- **Key fields**: `url` (required in practice for this type). `content` is not used.
- **Note**: the display name is **"Links"** while the id and schema field are `url`.
- **Seed examples**: _GitHub Actions Documentation_, _Docker Documentation_, _Tailwind CSS Documentation_, _shadcn/ui_, _Material Design 3_, _Lucide Icons_.

---

## Classification: Text vs File vs URL

The `Item.contentType` column is typed as `String` with the comment `// text | file` (and the seed's `SeedItem` interface uses `contentType: "text" | "file"`). Critically, **`contentType` describes the storage medium, not the semantic item type** — the semantic type is always `typeId`.

| Storage medium | Types | Fields populated |
| --- | --- | --- |
| **Text** | `snippet`, `prompt`, `command`, `note` | `content` (+ `language` for code-like types) |
| **URL** | `url` | `url`. Also seeded with `contentType: "text"` — the `url` column carries the payload, not `content`. |
| **File** | `file`, `image` | `fileUrl`, `fileName`, `fileSize` (planned; not yet populated) |

Two things follow from this:

1. The `url` type is not a separate `contentType` value today. It is a text-storage item whose payload lives in the `url` column. Adding a dedicated `"url"` literal would be a schema/type change, not just a data change.
2. `contentType` is never read by application code. A repo-wide search found it only in `prisma/schema.prisma` and `prisma/seed.ts`; no `src/**` file consumes it. Anything that varies per type in the UI keyed off of `typeId`, not `contentType`.

---

## Shared Properties

Every item, regardless of type, carries:

| Field | Notes |
| --- | --- |
| `id` | `cuid()`, stable in seed via explicit ids |
| `title` | Required |
| `description` | Optional summary shown in item rows |
| `typeId` | → `ItemType`; `onDelete: Restrict` (a type cannot be deleted while items use it) |
| `userId` | → `User`; `onDelete: Cascade` |
| `collectionId` | Optional; `onDelete: SetNull` (mixed item types allowed in a collection) |
| `tags` | Many-to-many through `ItemTag` → `Tag` |
| `isFavorite` | Boolean, default `false` |
| `isPinned` | Boolean, default `false` |
| `createdAt` / `updatedAt` | Timestamps |

Indexes cover `userId`, `typeId`, `collectionId`, `[userId, createdAt]` and `[userId, isPinned]`.

### ItemType fields

| Field | Notes |
| --- | --- |
| `id` | Stable slug for system types (`snippet`, `prompt`, …) |
| `name` | Display name, plural ("Snippets") |
| `icon` | Lucide icon **name** (string), resolved to a component at render time |
| `color` | Hex string used by seed/mock data (see colour caveat below) |
| `isSystem` | `true` for the 7 built-ins |
| `userId` | `null` for system types; set for Pro custom types |

Constraint `@@unique([userId, name])` prevents duplicate names per user. Custom types are Pro-only per the product spec; they render with the fallback visual (`text-muted-foreground` / `bg-muted` / `ring-foreground/10`) unless their icon name and type id are recognised.

---

## Display Differences

The current UI is largely **type-agnostic**, so the real differences are visual accents rather than different content renderers.

- **`src/components/dashboard/item-row.tsx`** renders every item the same way: type icon (tinted `bgClass`, icon in `textClass`), the row ring in `borderClass`, title, pin/favorite indicators, description, tag badges and `updatedAt`. It does **not** branch on `typeId` or read `content`, `url`, `fileUrl`, `fileName`, `fileSize` or `language`.
- **`src/lib/item-type-meta.ts`** is the single source of display visuals. `getTypeVisual(typeId, iconName?)` resolves the icon (DB `icon` name → known system id → generic `File`) and the colour classes.
- **Colour caveat**: the hex `color` stored on `ItemType` (and in `mock-data.ts`) is **not consumed by `getTypeVisual`** — the visual map hardcodes equivalent Tailwind classes (`text-blue-400`, etc.). The seed hex and the Tailwind hue match, but two separate sources describe the same colour.
- **Sidebar** (`src/components/dashboard/sidebar.tsx`): system types link to `/items/{id}`, showing icon + name + item count. `file` and `image` additionally show a "PRO" badge via `PRO_TYPE_IDS`.
- **Collection cards / sidebar collection rows**: show the set of type icons present, or a coloured dot / border derived from the collection's **dominant** type.
- **Profile usage stats** (`src/components/profile/usage-stats.tsx`): per-type item counts with the tinted icon, including zero-count types.
- **No item detail or editor page exists yet.** `/items/[type]` currently renders only the type name and count from mock data, and `/collections/[id]` only the collection name/description. Consequently there is no type-specific view for code highlighting, image preview, link opening or file download at this time.

---

## Seed Coverage

`prisma/seed.ts` seeds the 7 system types plus 5 collections and 18 items (all belonging to `demo@devstash.io`). Counts by type:

| Type | Seeded items |
| --- | ---: |
| `snippet` | 4 |
| `prompt` | 3 |
| `command` | 5 |
| `url` | 6 |
| `note` | 0 |
| `file` | 0 |
| `image` | 0 |
| **Total** | **18** |

`src/lib/mock-data.ts` also defines fake per-type counts (24/18/15/12/5/3/8) for the pre-database UI; those are placeholder values and do not reflect the database.

---

## Observations

1. **`note`, `file` and `image` have no seeded examples.** Their schema fields and visuals exist, but there is no data or UI exercising them yet.
2. **`contentType` is effectively unused** by the app and conflates storage medium with semantics. URL items are stored as `contentType: "text"` with a `url`, so the comment `// text | file` understates the real model.
3. **Two colour sources**: the DB `ItemType.color` hex and the hardcoded Tailwind classes in `item-type-meta.ts`. Custom types with a custom `color` will not pick it up at render time.
4. **Pro gating discrepancy**: `PRO_TYPE_IDS` marks both `file` and `image` as Pro, while `context/project-overview.md` places "image uploads" in the Free tier and "file uploads" in Pro.
5. **Type-aware rendering is not implemented** — content, URL and file fields are stored but not displayed anywhere; item rows are intentionally generic.
