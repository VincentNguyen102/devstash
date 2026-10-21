# Homepage Spec

## Overview

Build the real DevStash marketing homepage at `/` from the static mockup in `prototypes/homepage/`. Replace the placeholder in `src/app/page.tsx` with the full page, matching the mockup's layout, copy and motion while using the app's Next.js App Router, Tailwind v4 and ShadCN components.

The page is public and static: no auth check, no database, no server actions.

## Requirements

### Page structure

- Public `/` route (already outside the `src/proxy.ts` matcher).
- Server component page with a `metadata` export using the mockup title and description.
- Sections in this order:
  1. **Header** — logo, Features/Pricing anchors, Sign In, Get Started, mobile menu.
  2. **Hero** — eyebrow, gradient headline, lede, CTAs, meta, and the chaos → arrow → dashboard visual.
  3. **Features** — six cards: Code Snippets, AI Prompts, Instant Search, Commands, Files & Docs, Collections.
  4. **AI** — Pro Feature badge, heading, lede, four-item checklist, static code panel with AI-generated tags.
  5. **Pricing** — Monthly/Yearly toggle, Free and Pro cards, highlighted Pro card, pricing footnote.
  6. **CTA** — glow panel, heading, primary/secondary actions, meta.
  7. **Footer** — brand/tagline, Product and Account link columns, copyright with the current year.
- Use the copy, demo items, stats and labels from `prototypes/homepage/index.html`.

### Server / client split

| File | Type | Responsibility |
| --- | --- | --- |
| `src/app/page.tsx` | Server | Metadata, section composition, mounts the reveal observer |
| `src/lib/homepage.ts` | Shared | Typed nav links, CTA hrefs, features, plans, footer links and static content |
| `src/components/home/section.tsx` | Server | Shared `Container`, `Eyebrow` and `SectionHeading` primitives |
| `src/components/home/site-header.tsx` | Client | Scroll state and mobile menu |
| `src/components/home/hero.tsx` | Server | Hero copy, CTA row and visual layout; renders `ChaosStage` |
| `src/components/home/chaos-stage.tsx` | Client | Animated knowledge-source tiles |
| `src/components/home/dashboard-preview.tsx` | Server | Static decorative dashboard mockup |
| `src/components/home/features-section.tsx` | Server | Maps feature data to cards |
| `src/components/home/ai-section.tsx` | Server | Static code panel and AI tags |
| `src/components/home/pricing-section.tsx` | Client | Billing-period state and price display |
| `src/components/home/cta-section.tsx` | Server | Final CTA panel |
| `src/components/home/site-footer.tsx` | Server | Footer; computes `new Date().getFullYear()` |
| `src/components/home/scroll-reveal.tsx` | Client | One `IntersectionObserver` for `[data-reveal]` elements |

Keep the client boundary as small as possible. Only the header, chaos stage, pricing section and reveal observer need `"use client"`; the rest of the page stays server-rendered.

### Links

| Element | Destination |
| --- | --- |
| Brand logo (header/footer) | `/` |
| Features (nav/footer) | `#features` |
| Pricing (nav/footer) | `#pricing` |
| AI (footer) | `#ai` |
| Sign In | `/sign-in` |
| Get Started / Get Started Free / Start for free / Start 14-day trial | `/register` |
| Explore Features / See what's inside | `#features` |
| Footer account links | `/sign-in`, `/register`, `/dashboard` |

- Use `next/link` for route links and plain `<a>` for same-page hash anchors.
- Use the section ids `features`, `ai` and `pricing` for the in-page anchors.
- The mockup's Docs/Guides/Support/Status/About/Blog/Contact/Privacy pages do not exist. Omit those placeholder links (or render them as non-interactive muted text) — do not ship dead `href="#"` links.
- All Pro CTAs go to `/register` until Stripe/checkout exists.
- Add `scroll-mt-24` to anchored sections so the fixed header does not cover them.

### Styling

- Tailwind v4 utilities and the existing ShadCN primitives: `Button` (with `asChild` for links), `Badge` and `Card`. Do not modify the shared button/badge variants just for this page.
- Use a blue → indigo gradient on primary marketing CTAs and `variant="outline"`/`secondary` for secondary actions.
- Use `lucide-react` icons; keep Notion/VS Code/brand marks as small inline SVGs (no new icon dependency).
- Use `getTypeVisual()` from `src/lib/item-type-meta.ts` for type icons and accent classes so the feature cards and dashboard preview match the rest of the app. Do not hardcode the prototype's per-type hex values.
- Put any custom keyframes or decorative background layers in `src/app/globals.css` (Tailwind v4 CSS-first config only — no `tailwind.config.*`). No inline styles.
- Keep shared text/layout in `section.tsx`, content arrays in `homepage.ts`, and map over data rather than duplicating markup.

### Motion

- **Header:** translucent by default; add stronger background/blur and a border after ~8px of scroll.
- **Chaos stage:** port the physics from `prototypes/homepage/script.js` — initial scatter with overlap separation, drift, wall bounce, subtle rotation/pulse, pointer repulsion, resize re-scatter, and `requestAnimationFrame` cleanup on unmount.
- **Arrow:** CSS pulse/halo animation; rotates 90° to point down on mobile.
- **Reveal:** fade/translate elements into view with a small stagger; observer unobserves after reveal.
- **AI tags:** stagger in when their panel becomes visible.
- **Pricing:** monthly shows `$8 / month`; yearly shows `$6 / month` with `$72` billed yearly; the toggle uses `aria-pressed`.
- Respect `prefers-reduced-motion`: show content immediately, scatter the tiles statically, and disable drift, pulse and reveal transitions.

### Responsive & accessibility

- Hero visual stacks vertically below `lg`; arrow points down.
- Features: 1 column on mobile, 2 on `sm`, 3 on `lg`.
- AI and pricing sections stack on mobile; pricing is 2 columns from `md`.
- Header collapses to a mobile menu that closes on link click, Escape, outside click and resize above the breakpoint.
- Add a "Skip to content" link, semantic `header`/`main`/`section`/`footer` landmarks, a single `h1`, ordered headings and visible focus styles.
- Mark the decorative dashboard preview as `aria-hidden`; give the chaos stage a concise accessible label.
- No horizontal overflow at any breakpoint.

## Notes

- The homepage is statically rendered; do not call `connection()`, Prisma or `auth()`.
- No changes to `src/app/layout.tsx` are needed — it already provides the dark theme, Geist fonts and `<Toaster />`.
- No unit tests are required (no server actions or utilities); verify behavior in the browser.
- Run `npm run lint`, `npm run build` and `npm run test`, then check the page at ~1440px, ~1096px and 390px: all links, mobile menu, billing toggle, animations, reduced-motion mode and overflow.

## References

- @prototypes/homepage/index.html
- @prototypes/homepage/styles.css
- @prototypes/homepage/script.js
- @context/features/homepage-mockup-spec.md
- @context/project-overview.md
- @context/coding-standards.md
- @src/components/ui/button.tsx
- @src/components/ui/badge.tsx
- @src/components/ui/card.tsx
- @src/lib/item-type-meta.ts
- @src/app/globals.css
