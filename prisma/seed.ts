import "dotenv/config";

import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";

// Built-in item types available to every user. Ids are stable slugs so the
// `/items/[type]` routes and the shared type visuals keep working now that
// data comes from the database. Custom types are created by Pro users and
// live alongside these with a `userId` set and `isSystem: false`.
const SYSTEM_ITEM_TYPES = [
  { id: "snippet", name: "Snippets", icon: "CodeXml", color: "#60a5fa" },
  { id: "prompt", name: "Prompts", icon: "Sparkles", color: "#a78bfa" },
  { id: "command", name: "Commands", icon: "Terminal", color: "#fb923c" },
  { id: "note", name: "Notes", icon: "StickyNote", color: "#facc15" },
  { id: "file", name: "Files", icon: "File", color: "#94a3b8" },
  { id: "image", name: "Images", icon: "Image", color: "#f472b6" },
  { id: "url", name: "Links", icon: "Link", color: "#4ade80" },
];

// Demo account for local development and demos. The password is hashed with
// bcryptjs at 12 rounds (never stored in plain text).
const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
  isPro: false,
};

interface SeedItem {
  id: string;
  title: string;
  typeId: string;
  description: string;
  contentType: "text" | "file";
  content?: string;
  url?: string;
  language?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

interface SeedCollection {
  id: string;
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItem[];
}

// Sample content for development & demos. Ids are stable so re-running the
// seed never duplicates rows. All items belong to the demo user.
const COLLECTIONS: SeedCollection[] = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        id: "item_react_custom_hooks",
        title: "Custom React Hooks",
        typeId: "snippet",
        description: "Reusable hooks: useDebounce and useLocalStorage",
        contentType: "text",
        language: "typescript",
        isFavorite: true,
        isPinned: true,
        tags: ["react", "hooks", "typescript"],
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
      },
      {
        id: "item_react_component_patterns",
        title: "Component Patterns",
        typeId: "snippet",
        description: "Context providers and compound components",
        contentType: "text",
        language: "tsx",
        tags: ["react", "context", "patterns"],
        content: `import { createContext, useContext, type ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<Theme>("dark");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme: Theme = "dark";

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}`,
      },
      {
        id: "item_react_utilities",
        title: "Utility Functions",
        typeId: "snippet",
        description: "Small helpers used across the UI layer",
        contentType: "text",
        language: "typescript",
        tags: ["react", "utilities", "typescript"],
        content: `export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return (bytes / 1024 ** index).toFixed(1) + " " + units[index];
}`,
      },
    ],
  },
  {
    id: "col_ai_workflows",
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    items: [
      {
        id: "item_ai_code_review",
        title: "Code Review Prompt",
        typeId: "prompt",
        description: "Ask the model to review a diff for bugs and clarity",
        contentType: "text",
        isFavorite: true,
        tags: ["ai", "review", "prompt"],
        content: `You are a senior software engineer reviewing a pull request.

Review the diff below and report:
1. Bugs or logic errors
2. Security or data-loss risks
3. Missing edge cases and error handling
4. Readability and naming issues

For each finding, cite the file and line, explain the impact and suggest a concrete fix.
Be concise and skip nitpicks that an automated formatter would catch.

Diff:
<diff>`,
      },
      {
        id: "item_ai_docs_generation",
        title: "Documentation Generation Prompt",
        typeId: "prompt",
        description: "Generate Markdown API docs from a source file",
        contentType: "text",
        tags: ["ai", "docs", "prompt"],
        content: `You are a technical writer. Given the source file below, produce Markdown API documentation.

Include:
- A one-paragraph overview of the module
- A section per exported symbol with its signature, parameters, return value and a short usage example
- Any side effects or error conditions

Keep descriptions factual and do not invent behaviour that is not in the code.

Source:
<source>`,
      },
      {
        id: "item_ai_refactoring",
        title: "Refactoring Assistance Prompt",
        typeId: "prompt",
        description: "Improve code without changing its behaviour",
        contentType: "text",
        tags: ["ai", "refactoring", "prompt"],
        content: `You are a refactoring assistant. Improve the code below without changing its behaviour.

Goals:
- Reduce duplication and nesting
- Prefer small, single-purpose functions
- Improve naming and type safety
- Keep the public API stable

Return the refactored code followed by a bullet list of the changes and why they were made.

Code:
<code>`,
      },
    ],
  },
  {
    id: "col_devops",
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        id: "item_devops_dockerfile",
        title: "Multi-stage Dockerfile",
        typeId: "snippet",
        description: "Production image for a Next.js app",
        contentType: "text",
        language: "dockerfile",
        tags: ["docker", "ci-cd", "deployment"],
        content: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]`,
      },
      {
        id: "item_devops_deploy_script",
        title: "Deployment Script",
        typeId: "command",
        description: "Build and release with zero-downtime reload",
        contentType: "text",
        language: "bash",
        tags: ["deployment", "ci-cd", "bash"],
        content: `#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run build
npx prisma migrate deploy
npx pm2 reload ecosystem.config.js --update-env`,
      },
      {
        id: "item_devops_github_actions_docs",
        title: "GitHub Actions Documentation",
        typeId: "url",
        description: "Official GitHub Actions docs for CI/CD workflows",
        contentType: "text",
        url: "https://docs.github.com/en/actions",
        tags: ["ci-cd", "docs"],
      },
      {
        id: "item_devops_docker_docs",
        title: "Docker Documentation",
        typeId: "url",
        description: "Official Docker documentation and CLI reference",
        contentType: "text",
        url: "https://docs.docker.com/",
        tags: ["docker", "docs"],
      },
    ],
  },
  {
    id: "col_terminal_commands",
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    items: [
      {
        id: "item_cmd_git_operations",
        title: "Git Operations",
        typeId: "command",
        description: "Undo commits and amend messages",
        contentType: "text",
        language: "bash",
        isFavorite: true,
        tags: ["git", "bash"],
        content: `# Undo the last commit but keep the changes staged
git reset --soft HEAD~1

# Discard the commit and its changes
git reset --hard HEAD~1

# Amend the last commit message
git commit --amend -m "Corrected message"`,
      },
      {
        id: "item_cmd_docker_cleanup",
        title: "Docker Cleanup",
        typeId: "command",
        description: "Free disk space from unused Docker resources",
        contentType: "text",
        language: "bash",
        tags: ["docker", "bash"],
        content: `# Remove all stopped containers
docker container prune -f

# Remove unused images, networks and build cache
docker system prune -af --volumes`,
      },
      {
        id: "item_cmd_process_management",
        title: "Process Management",
        typeId: "command",
        description: "Find and kill the process using a port",
        contentType: "text",
        language: "bash",
        tags: ["process", "bash"],
        content: `# Find the process listening on a port (e.g. 3000)
lsof -i :3000

# Kill it by PID
kill -9 <PID>`,
      },
      {
        id: "item_cmd_package_manager",
        title: "Package Manager Utilities",
        typeId: "command",
        description: "Keep dependencies up to date",
        contentType: "text",
        language: "bash",
        tags: ["npm", "pnpm", "bash"],
        content: `# Check outdated packages
npm outdated

# Update within the semver range
npm update

# Interactive upgrades to the latest (pnpm)
pnpm up --interactive --latest`,
      },
    ],
  },
  {
    id: "col_design_resources",
    name: "Design Resources",
    description: "UI/UX resources and references",
    items: [
      {
        id: "item_design_tailwind_docs",
        title: "Tailwind CSS Documentation",
        typeId: "url",
        description: "Utility-first CSS framework reference",
        contentType: "text",
        url: "https://tailwindcss.com/docs",
        tags: ["css", "tailwind", "docs"],
      },
      {
        id: "item_design_shadcn",
        title: "shadcn/ui",
        typeId: "url",
        description: "Copy-paste component library built on Radix UI",
        contentType: "text",
        url: "https://ui.shadcn.com/",
        isFavorite: true,
        tags: ["components", "ui"],
      },
      {
        id: "item_design_material",
        title: "Material Design 3",
        typeId: "url",
        description: "Google's design system guidelines",
        contentType: "text",
        url: "https://m3.material.io/",
        tags: ["design-system", "ui"],
      },
      {
        id: "item_design_lucide",
        title: "Lucide Icons",
        typeId: "url",
        description: "Open-source icon set used across the app",
        contentType: "text",
        url: "https://lucide.dev/",
        tags: ["icons", "ui"],
      },
    ],
  },
];

async function seedSystemItemTypes() {
  // Upsert by id so re-running the seed is safe and never duplicates types.
  // (`@@unique([userId, name])` can't be used here because system types have
  // no `userId` and Postgres treats NULLs as distinct.)
  for (const { id, ...type } of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id },
      update: { ...type, isSystem: true, userId: null },
      create: { id, ...type, isSystem: true },
    });
  }
}

async function seedDemoUser() {
  const password = await hash(DEMO_USER.password, 12);

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      name: DEMO_USER.name,
      password,
      isPro: DEMO_USER.isPro,
      emailVerified: new Date(),
    },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password,
      isPro: DEMO_USER.isPro,
      emailVerified: new Date(),
    },
  });
}

async function seedCollections(userId: string) {
  for (const { items, ...collection } of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { id: collection.id },
      update: { ...collection, userId },
      create: { ...collection, userId },
    });

    for (const { tags, ...item } of items) {
      await prisma.item.upsert({
        where: { id: item.id },
        update: { ...item, userId, collectionId: collection.id },
        create: { ...item, userId, collectionId: collection.id },
      });

      for (const name of tags ?? []) {
        const tag = await prisma.tag.upsert({
          where: { userId_name: { userId, name } },
          update: {},
          create: { name, userId },
        });

        await prisma.itemTag.upsert({
          where: { itemId_tagId: { itemId: item.id, tagId: tag.id } },
          update: {},
          create: { itemId: item.id, tagId: tag.id },
        });
      }
    }
  }
}

async function main() {
  await seedSystemItemTypes();

  const user = await seedDemoUser();
  await seedCollections(user.id);

  const [types, collections, items] = await Promise.all([
    prisma.itemType.count({ where: { isSystem: true } }),
    prisma.collection.count({ where: { userId: user.id } }),
    prisma.item.count({ where: { userId: user.id } }),
  ]);

  console.log(
    `Seeded ${types} system item types, ${collections} collections and ${items} items for ${user.email}.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
