<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

ChromaShift — Project PRD & Handoff Notes
=========================================

Purpose
-------
This file summarises the Product Requirements Document (PRD), technical direction, and a concise codebase map to help a coworker pick up the project quickly.

Elevator pitch
--------------
Upload a UI screenshot or SVG and instantly generate multiple production-ready themes while preserving visual hierarchy, readability, and accessibility. The engine remaps colors intelligently (algorithmically), avoiding heavy ML models.

Core goals (MVP)
- Fast, visually impressive demo for public judging
- Deterministic, browser-side processing where possible
- Themes: dark, modern SaaS, pastel, cyberpunk, monochrome, accessibility-optimized
- Live before/after slider, accessibility scoring, export of CSS/Tailwind/JSON

Tech stack
- Frontend: Next.js, TypeScript, TailwindCSS, shadcn/ui, Framer Motion
- Processing: client-side preferred; suggested libs: OpenCV.js, chroma.js, culori, svgson, svg-parser

Processing pipeline (high-level)
--------------------------------
Upload → Color Quantization → Region Detection → Component Grouping → Semantic Color Guessing → Palette Generation → Theme Remapping → Live Preview → Export

What to avoid
- Heavy backend or paid AI services, auth/billing/collaboration, full design-system scope

Key files & responsibilities
- App entry / pages: [src/app/page.tsx](src/app/page.tsx)
- Global layout/styles: [src/app/layout.tsx](src/app/layout.tsx), [src/app/globals.css](src/app/globals.css)
- Upload UI: [src/components/upload/upload-dropzone.tsx](src/components/upload/upload-dropzone.tsx)
- Workspace / analysis UI: [src/components/workspace/analysis-workspace.tsx](src/components/workspace/analysis-workspace.tsx)
- Palette / preview components: [src/components/palette/palette-inspector.tsx](src/components/palette/palette-inspector.tsx), [src/components/preview/before-after-preview.tsx](src/components/preview/before-after-preview.tsx)
- Theme UI primitives & toggle: [src/components/theme/theme-toggle.tsx](src/components/theme/theme-toggle.tsx)
- UI building blocks: [src/components/ui](src/components/ui)
- Color processing libs and core algorithms: [src/lib/color](src/lib/color)
- Utility helpers: [src/lib/utils.ts](src/lib/utils.ts)
- Export helpers: [src/lib/export/css.ts](src/lib/export/css.ts), [src/lib/export/payloads.ts](src/lib/export/payloads.ts)

Developer onboarding — quick steps
---------------------------------
1. Install dependencies

```bash
pnpm install
```

2. Run dev server

```bash
pnpm dev
```

3. Open http://localhost:3000 and use the upload flow; try the try/ page for playground: [src/app/try/page.tsx](src/app/try/page.tsx)

Notes about the codebase
- The UI is componentized; look under [src/components](src/components) for feature surfaces.
- Color logic lives in [src/lib/color/*.ts](src/lib/color) — semantic detection, remapping and utilities are implemented here.
- Exports (CSS variables / Tailwind / JSON) live under [src/lib/export](src/lib/export).
- Accessibility helpers are in [src/lib/color/accessibility.ts](src/lib/color/accessibility.ts).

Priority areas to review / extend
- Color quantization & clustering (k-means) — tune cluster counts and distance metrics (LAB/OKLCH)
- Semantic heuristics — ensure heuristics map repeated regions and contrasts to roles (background, text, accent, CTA, cards)
- Before/after slider — important demo feature; verify performance with large images
- Export formats — ensure tokens match Tailwind/CSS exports used in demo

Testing & verification
- No heavy CI required for contest; add focused unit tests for color math in [src/lib/color] if time permits

Style & conventions
- TypeScript strictness preferred; follow existing lint/format rules in package.json
- Use Tailwind utility classes and shadcn components for consistent UI

Hand-off checklist for coworker
- Read this file and the PRD excerpt in the repo root
- Start dev server and verify upload → palette → preview flow
- Inspect [src/lib/color] for remapping logic; experiment with small image samples
- If adding new presets, update theme presets in [src/lib/color/themes.ts](src/lib/color/themes.ts)

Contacts & context
- This repo is built for a 1-week public-judging demo: prioritise visual polish and responsiveness over exhaustive feature completeness.

Next steps I completed
- Drafted this onboarding summary and updated AGENTS.md for handoff.

