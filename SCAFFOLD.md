# Tech Ops Toolshop — Scaffold Spec

## What This Is

The Toolshop is a TanStack Start app that serves as the container/launcher for all Tech Ops Spreelets. It reads `spreelet.json` manifests, renders Cards, and hosts Spark components. It doesn't own business logic — each Spreelet does that. The Toolshop's job is discovery, navigation, and the Spark Launcher.

## Tech Stack

Same as every Kova app: TanStack Start, TanStack Router, React Query v5, Tailwind CSS v4, Spreeform, Zod. No additional dependencies beyond what `init-project` provides.

## MVP Scope (Phase 1)

The minimum viable Toolshop does three things:

1. **Reads manifests** from a registry (local JSON file to start, API later)
2. **Renders Cards** in a browsable grid
3. **Links to full apps** via the Card's "Open →" button

No Spark Launcher, no summary polling, no entity resolution. Just Cards.

## File Structure

```
techops-toolshop/
├── spreelet.json               # The Toolshop's own manifest (it's a Spreelet too)
├── src/
│   ├── routes/
│   │   ├── __root.tsx          # Shell layout: header + main content area
│   │   └── index.tsx           # Home: Card grid
│   ├── components/
│   │   ├── SpreeletCard.tsx    # Renders one Card from manifest data
│   │   ├── CardGrid.tsx        # Responsive grid of Cards
│   │   ├── ToolshopHeader.tsx  # Header with domain name + search
│   │   └── SparkLauncher.tsx   # (Phase 2) Modal/panel that loads Spark bundles
│   ├── server/
│   │   ├── registry.ts         # Loads and validates spreelet manifests
│   │   └── summary-poller.ts   # (Phase 2) Fetches summary endpoints
│   ├── data/
│   │   └── registry.json       # Static registry of known Spreelets
│   ├── types/
│   │   └── manifest.ts         # Zod schema + TypeScript types for spreelet.json
│   └── lib/
│       └── icons.ts            # Dynamic lucide-react icon resolver
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## Data Model

### Registry (Phase 1: static file)

```json
// src/data/registry.json
{
  "domain": "tech-ops",
  "spreelets": [
    {
      "id": "pm-helper",
      "manifestUrl": "https://pm-helper.kova.eks.prod.tk.dev/.well-known/spreelet.json"
    },
    {
      "id": "find-my-request",
      "manifestUrl": "https://find-my-request.kova.eks.prod.tk.dev/.well-known/spreelet.json"
    },
    {
      "id": "team-kpi-dashboard",
      "manifestUrl": "https://team-kpi-dashboard.kova.eks.prod.tk.dev/.well-known/spreelet.json"
    }
  ]
}
```

For the MVP, the registry can just inline the manifest data directly (no fetching). The server function reads `registry.json`, returns it. Later, it fetches each `manifestUrl` at startup and caches.

### Manifest Zod Schema

Already defined in `spreelet-patterns/MANIFEST.md`. Copy the Zod schema into `src/types/manifest.ts` and validate on load.

## Components

### SpreeletCard

Renders a single Card. Inputs: a validated manifest object.

```
┌─────────────────────────────────┐
│  [icon]  PM Helper              │
│                                 │
│  Generate LTR snapshots,        │
│  manage roadmaps, and track     │
│  KPIs by team                   │
│                                 │
│  roadmap · kpis · snapshots     │
│                                 │
│  [Open →]        [Quick open]   │
└─────────────────────────────────┘
```

- Icon: resolve `manifest.icon` to a lucide-react component dynamically
- Tags: render `manifest.tags` as small chips
- "Open →" links to `manifest.url`
- "Quick open" (Phase 2): launches SparkLauncher with `manifest.surfaces.spark`
- If `surfaces.card.summaryEndpoint` exists (Phase 2): show polled key-value data

### CardGrid

Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Cards sorted by `manifest.name` alphabetically. Optional: search/filter bar that matches against `name`, `description`, `tags`.

### ToolshopHeader

```
┌─────────────────────────────────────────────┐
│  Tech Ops Toolshop              [search]    │
└─────────────────────────────────────────────┘
```

Simple. Domain name on the left (from `TOOLSHOP_DOMAIN` env var or hardcoded "Tech Ops" for now), optional search input on the right.

### SparkLauncher (Phase 2)

A modal or panel component that:
1. Receives a `surfaces.spark` config
2. Dynamically imports the Spark bundle via `<script>` tag
3. Creates the custom element (`spreelet-spark-{id}`)
4. Dispatches `toolshop-message` events (auth-token, theme-change)
5. Listens for `spark-message` events (open-full, request-resize)
6. On `open-full`: navigates to the full app URL

## Routes

### `__root.tsx`
- Spreeform ThemeProvider
- ToolshopHeader
- `<Outlet />` for child routes
- Max width: `max-w-7xl` (wide dashboard)

### `index.tsx` (Home)
- Server function: `getRegistry()` → returns validated manifest array
- React Query: cache with `staleTime: 5 * 60 * 1000`
- Renders `CardGrid` with loading skeletons
- URL param: `?search=` for filtering (optional)

## Phase Roadmap

### Phase 1 (MVP — the demo)
- Static registry with 3 Spreelets
- Card grid with responsive layout
- "Open →" links to full apps
- Basic header with domain name
- Deploy to Kova

### Phase 2 (Spark + Summary)
- SparkLauncher component
- "Quick open" button on Cards
- Summary endpoint polling for Cards with `surfaces.card`
- Dynamic manifest fetching from `manifestUrl`

### Phase 3 (Federation)
- Entity search across Spreelets
- Cross-Spreelet navigation (click team name → PM Helper)
- Unified search that queries all Spreelet search APIs
- `entity-registry.yaml` integration

## Environment

```
TOOLSHOP_DOMAIN=tech-ops
```

## Design Notes

- The Toolshop uses Spreeform for all UI — it's the living demo of the design system
- Cards should feel like a "start page" — clean, scannable, fast
- No sidebar navigation needed for Phase 1 (just one page of Cards)
- Dark mode support comes from Spreeform tokens — no extra work needed
- Search filtering is client-side for 3-10 Spreelets; server-side if it grows beyond that

## Build Instructions for Claude Code

When opening a Claude Code session in `techops-toolshop/`:
1. Install the kova-plugin and tech-ops plugin
2. Use the `init-project` skill to scaffold TanStack Start + Spreeform
3. Use the `spreelet-patterns` skill — it will route you to MANIFEST.md for the Zod schema
4. Use the `spreeform` skill for component patterns
5. Copy the three `spreelet.json` files from the sibling directories as test data
6. Build the Card grid first, then layer in features

## Entity Ownership Summary

This table shows how entities flow across the three Spreelets:

| Entity Domain | Owned By | Used By |
|---------------|----------|---------|
| teams, people | PM Helper | Find My Request, Team KPI Dashboard |
| roadmap-items | PM Helper | — |
| snapshots | PM Helper | — |
| issues | Find My Request | PM Helper, Team KPI Dashboard |
| kpis | Team KPI Dashboard | PM Helper |
| estimates | Team KPI Dashboard | — |
