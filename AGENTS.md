# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

## Neon MCP — project & branch scope

When using any Neon MCP tool, always target the DevStash **development** branch. Never connect to, read from, or write to **production** unless I explicitly ask for it in that message.

| Target   | ID                        |
| -------- | ------------------------- |
| Project  | `shy-heart-70914834`      |
| Branch   | `br-twilight-wind-b3lrs3kz` (name: `development`) |
| Database | `neondb`                  |

Rules:

- Pass `project_id: "shy-heart-70914834"` and `branch_id: "br-twilight-wind-b3lrs3kz"` explicitly on every Neon MCP call (the connection is unscoped).
- Do **not** use `list_projects` to guess a project, and do not pass a branch name where an ID is required — resolve names with `list_branches` if needed.
- The production branch (`br-dawn-fog-b3iwlp96`, name `production`) is off-limits. Read-only or otherwise, treat it as forbidden until I say the exact words that I want production.
- Never run DDL or destructive SQL (DROP, TRUNCATE, DELETE, ALTER, migrate reset) against any branch without asking me first.
- Do not create projects, branches, or endpoints as a side effect of a task.
- Schema changes go through Prisma migrations, not ad-hoc SQL against the branch.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
