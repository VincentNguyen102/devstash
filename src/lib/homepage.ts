/** Stable type ids shared by the marketing page and the app's item visuals. */
export type HomeTypeId =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "file"
  | "image"
  | "url";

export type BillingPeriod = "monthly" | "yearly";

export interface HomeLinkItem {
  label: string;
  href: string;
}

export interface HomeFeature {
  typeId: HomeTypeId;
  title: string;
  description: string;
}

export interface HomePlan {
  id: "free" | "pro";
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPeriod: string;
  yearlyPeriod: string;
  monthlyNote: string;
  yearlyNote: string;
  cta: string;
  href: string;
  features: string[];
  featured?: boolean;
}

export interface HomeFooterGroup {
  title: string;
  links: HomeLinkItem[];
}

export interface HomeDashboardNavItem {
  typeId: HomeTypeId;
  label: string;
  count: number;
}

export interface HomeDashboardCard {
  typeId: HomeTypeId;
  title: string;
  tags: string[];
}

export type ChaosSourceId =
  | "notion"
  | "github"
  | "slack"
  | "vscode"
  | "browser"
  | "terminal"
  | "text"
  | "bookmark";

export interface ChaosSource {
  id: ChaosSourceId;
  label: string;
}

/** Route targets used across the marketing page. */
export const HOME_HREFS = {
  home: "/",
  signIn: "/sign-in",
  register: "/register",
  dashboard: "/dashboard",
} as const;

/** Shared gradient treatment for the primary marketing CTAs. */
export const PRIMARY_CTA_CLASS =
  "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-400";

export const HOME_NAV_LINKS: HomeLinkItem[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export const HOME_HERO = {
  eyebrow: "The developer knowledge hub",
  titleLead: "Stop Losing Your",
  titleAccent: "Developer Knowledge",
  description:
    "Snippets live in VS Code. Prompts are buried in Notion. Commands disappear into Slack threads. DevStash brings every piece of developer knowledge into one fast, searchable home.",
  primaryCta: "Get Started Free",
  secondaryCta: "Explore Features",
  meta: "Free forever plan · No credit card required",
} as const;

export const HOME_FEATURES_HEADING = {
  eyebrow: "Everything in one place",
  title: "One home for everything you know",
  description:
    "Seven item types, one searchable library. Stop context-switching between six tools just to find something you saved last month.",
} as const;

export const HOME_FEATURES: HomeFeature[] = [
  {
    typeId: "snippet",
    title: "Code Snippets",
    description:
      "Save reusable code with syntax highlighting, language badges and one-click copy. Never rewrite that helper again.",
  },
  {
    typeId: "prompt",
    title: "AI Prompts",
    description:
      "Keep your best prompts versioned and discoverable. Tune them once, then reuse them everywhere you work.",
  },
  {
    typeId: "url",
    title: "Instant Search",
    description:
      "Find anything in milliseconds with a Cmd+K palette that searches titles, content, tags and collections.",
  },
  {
    typeId: "command",
    title: "Commands",
    description:
      "Store the CLI incantations you always forget — docker, git, kubectl, ffmpeg and the rest of the toolbox.",
  },
  {
    typeId: "file",
    title: "Files & Docs",
    description:
      "Upload specs, PDFs, configs and screenshots. Preview, download and keep them next to the code they belong to.",
  },
  {
    typeId: "note",
    title: "Collections",
    description:
      "Group related items into collections so a whole project's knowledge travels together — code, notes and links.",
  },
];

export const HOME_AI = {
  eyebrow: "Pro Feature",
  title: "Your library, organised by AI",
  description:
    "Let DevStash handle the boring part. Save first, and AI tags, summarises and connects your knowledge in the background.",
  checklist: [
    {
      title: "Auto-generated tags",
      description:
        "Every snippet and note gets labelled the moment you save it.",
    },
    {
      title: "One-line summaries",
      description: "Long notes and docs become scannable at a glance.",
    },
    {
      title: "Related items",
      description:
        "Surface the thing you forgot you saved, right when it matters.",
    },
    {
      title: "Ask your library",
      description:
        "Natural-language answers drawn from everything you've stashed.",
    },
  ],
  tags: ["react", "hooks", "typescript", "performance", "debounce"],
} as const;

export const HOME_PRICING_HEADING = {
  eyebrow: "Pricing",
  title: "Simple plans that scale with your brain",
  description:
    "Start free. Upgrade when your library outgrows it. Cancel any time.",
} as const;

export const HOME_PLANS: HomePlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For developers getting organised.",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    monthlyPeriod: "/ forever",
    yearlyPeriod: "/ forever",
    monthlyNote: "No credit card. No trial timer.",
    yearlyNote: "No credit card. No trial timer.",
    cta: "Start for free",
    href: HOME_HREFS.register,
    features: [
      "50 items",
      "3 collections",
      "All 7 item types",
      "Full-text search & Cmd+K",
      "Code & markdown editors",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For developers who collect everything.",
    monthlyPrice: "$8",
    yearlyPrice: "$6",
    monthlyPeriod: "/ month",
    yearlyPeriod: "/ month",
    monthlyNote: "Billed monthly. Cancel anytime.",
    yearlyNote: "Billed $72 once a year — save $24.",
    cta: "Start 14-day trial",
    href: HOME_HREFS.register,
    features: [
      "Unlimited items",
      "Unlimited collections",
      "AI tagging & summaries",
      "Ask your library",
      "Priority support",
    ],
    featured: true,
  },
];

export const HOME_CTA = {
  eyebrow: "Your second brain, minus the mess",
  title: "Ready to Organize Your Knowledge?",
  description:
    "Join developers who stopped hunting through tabs, threads and sticky notes.",
  primaryCta: "Get Started Free",
  secondaryCta: "See what's inside",
  meta: "Set up in under a minute · Free forever plan",
} as const;

export const HOME_FOOTER = {
  tagline:
    "The developer knowledge hub for snippets, prompts, commands, notes, files, images and links.",
  note: "Built for developers who know where things are.",
  copyright: "DevStash. All rights reserved.",
} as const;

export const HOME_FOOTER_GROUPS: HomeFooterGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "AI", href: "#ai" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: HOME_HREFS.signIn },
      { label: "Create account", href: HOME_HREFS.register },
      { label: "Dashboard", href: HOME_HREFS.dashboard },
    ],
  },
];

export const DASHBOARD_PREVIEW_NAV: HomeDashboardNavItem[] = [
  { typeId: "snippet", label: "Snippets", count: 24 },
  { typeId: "prompt", label: "Prompts", count: 12 },
  { typeId: "command", label: "Commands", count: 18 },
  { typeId: "note", label: "Notes", count: 9 },
  { typeId: "file", label: "Files", count: 6 },
  { typeId: "image", label: "Images", count: 4 },
  { typeId: "url", label: "Links", count: 15 },
];

export const DASHBOARD_PREVIEW_STATS: string[] = [
  "88 items",
  "5 collections",
  "12 pinned",
];

export const DASHBOARD_PREVIEW_CARDS: HomeDashboardCard[] = [
  {
    typeId: "snippet",
    title: "useDebounce hook",
    tags: ["react", "hooks"],
  },
  {
    typeId: "prompt",
    title: "Code review prompt",
    tags: ["review", "gpt"],
  },
  {
    typeId: "command",
    title: "docker system prune",
    tags: ["docker"],
  },
  {
    typeId: "note",
    title: "Postgres index notes",
    tags: ["postgres", "perf"],
  },
  {
    typeId: "file",
    title: "design-tokens.json",
    tags: ["config"],
  },
  {
    typeId: "image",
    title: "App wireframe.png",
    tags: ["design"],
  },
];

export const CHAOS_SOURCES: ChaosSource[] = [
  { id: "notion", label: "Notion" },
  { id: "github", label: "GitHub" },
  { id: "slack", label: "Slack" },
  { id: "vscode", label: "VS Code" },
  { id: "browser", label: "Browser tabs" },
  { id: "terminal", label: "Terminal" },
  { id: "text", label: "Text file" },
  { id: "bookmark", label: "Bookmark" },
];

/** Static tile colours for the chaos stage, keyed by source. */
export const CHAOS_TILE_CLASSES: Record<ChaosSourceId, string> = {
  notion: "border-white/[0.15] bg-white text-[#111318]",
  github: "border-white/[0.12] bg-[#14171d] text-slate-100",
  slack: "border-white/[0.12] bg-[#14171d] text-white",
  vscode: "border-white/[0.12] bg-[#14171d] text-white",
  browser: "border-white/10 bg-[#1b2330] text-slate-400",
  terminal: "border-green-400/25 bg-[#0c1014] text-green-400",
  text: "border-white/10 bg-[#1b2330] text-slate-400",
  bookmark: "border-indigo-400/35 bg-[#1a1f3d] text-indigo-300",
};
