# Spreelet Standards Specification

**Version:** 0.2.0-draft
**Date:** 2026-03-09
**Author:** Brock Butler + Claude
**Status:** Draft — working straw man for refinement

---

## 1. Overview

### What This Document Covers

This specification defines the patterns, architecture, and conventions for building **Spreelets** — small, focused applications that help people at Spreetail work more effectively. Spreelets are surfaced through **Toolshops** — domain-scoped container applications that provide discovery, quick access, and navigation across an ecosystem of related tools.

The first Toolshop instance is the **Tech Ops Toolshop**, serving engineering and technology operations. Other domains (Data Engineering, Product, etc.) may create their own Toolshops following the same pattern.

### Design Philosophy

**Cultivated ecosystem, not enforced uniformity.** Many people will create Spreelets. Some will overlap. Some will die. The best ones will get adopted and refined. The standards here exist to:

- Reduce friction when users move between tools
- Make it trivially easy to surface a new Spreelet in a Toolshop
- Provide a graduated path from "quick experiment" to "polished tool"
- Enable shared capabilities (entities, memory, auth) without requiring them
- Be enforced through the build process (App Builder + tech-ops plugin), not manual compliance

### Vocabulary

| Term | Definition |
|---|---|
| **Spreelet** | An individual mini-application. Purpose-built, standalone-capable, optionally integrated into a Toolshop. |
| **Toolshop** | A domain-scoped container web application that hosts and surfaces Spreelets. The first instance is the Tech Ops Toolshop. |
| **Spreelet Card** | The card-based representation of a Spreelet within a Toolshop's browsing view. Generated automatically from manifest metadata — no Spreelet code changes needed. |
| **Spreelet Spark** | The compact, interactive version of a Spreelet that can appear in a modal, sidebar panel, or embedded context. Built by the Spreelet author as a plug-and-play component. |
| **Full App** | The standalone Spreelet experience at its own URL with all features. |
| **Spreelet Manifest** | A JSON file (`spreelet.json`) that describes a Spreelet's metadata, surfaces, capabilities, and entity domains. Published at a well-known URL. |
| **Spreelet Kit** | The shared component library and design tokens used across Spreelets. Extends Spreeform with TechOps-specific patterns. |
| **Entity Registry** | A central YAML/JSON file aggregating entity domain declarations from all Spreelet manifests. Used by skills to guide entity modeling and federation. |

---

## 2. Architecture

### 2.1 Domain-Scoped Toolshops

A Toolshop is a standalone TanStack Start application deployed on Kova. It is parameterized by domain:

```
TOOLSHOP_DOMAIN=tech-ops    # Determines registry, branding, and entity scope
```

One Toolshop codebase supports multiple domain instances. Each instance:

1. **Discovers Spreelets** by reading a domain-specific registry (initially a static JSON file, later a Kova API endpoint that aggregates manifests from deployed apps tagged with the domain).
2. **Renders Spreelet Cards** for each registered Spreelet. Cards are generated from manifest metadata — no custom code required per Spreelet.
3. **Hosts the Spark Launcher** — a modal or panel host that loads Spreelet Spark components for in-context use.
4. **Links to Full Apps** — navigates to the Spreelet's standalone URL with deep-link state in search params.

### 2.2 The Spreelet Manifest

Every Spreelet publishes a manifest at `/.well-known/spreelet.json`. The manifest has **required** and **optional** sections — this supports the graduated integration model.

#### Level 1: Discovery (Spreelet Card — no code)

```json
{
  "id": "find-my-request",
  "name": "Find My Request",
  "description": "Search for any Jira issue using natural language",
  "icon": "search",
  "version": "1.0.0",
  "url": "https://find-my-request.kova.eks.prod.tk.dev",
  "domain": "tech-ops",
  "tags": ["search", "jira", "issues"]
}
```

This is enough to appear in the Toolshop with a Spreelet Card. Five minutes of work. The Toolshop renders the card from this metadata — name, description, icon, tags, and an "Open →" button.

#### Level 2: Spark (interactive compact view — requires build)

```json
{
  "...level 1 fields...",
  "surfaces": {
    "spark": {
      "component": "https://find-my-request.../spreelet-spark.js",
      "preferredSurface": "modal",
      "maxWidth": 480,
      "maxHeight": 640
    },
    "full": {
      "url": "https://find-my-request.kova.eks.prod.tk.dev",
      "deepLinkParams": ["query", "issueKey", "teamHint"]
    }
  }
}
```

The Spark component is a self-contained JS bundle (Web Component) that the Toolshop dynamically loads into a modal or panel. The Spreelet author builds this using the `spreelet-patterns` skill, which provides templates and conventions for consistent Spark components.

#### Level 3: Full Integration (entities + summary)

```json
{
  "...level 2 fields...",
  "surfaces": {
    "card": {
      "summaryEndpoint": "https://find-my-request.../api/summary",
      "refreshInterval": 300
    },
    "spark": { "...as above..." },
    "full": { "...as above..." }
  },
  "entities": {
    "owns": [
      {
        "domain": "issues",
        "types": ["issue", "epic", "story"],
        "description": "Jira issue lookup and status tracking",
        "schema": "entities/issues.schema.json"
      }
    ],
    "uses": [
      {
        "domain": "teams",
        "types": ["team"],
        "source": "trino:mrt_jira__operations_metrics_report"
      },
      {
        "domain": "people",
        "types": ["person"],
        "source": "trino:mrt_jira__operations_metrics_report"
      }
    ]
  },
  "capabilities": ["search", "entity-resolution"]
}
```

### 2.3 The Three Surfaces

#### Spreelet Card (auto-generated, no code)

- Rendered in the Toolshop's main grid view
- Generated entirely from manifest metadata: name, description, icon, tags, "Open →" button
- **Card heights**: `compact` (120px), `standard` (200px), `tall` (320px). Determined by tag count and description length.
- **Live summary** (Level 3): The Toolshop polls a summary endpoint to show dynamic data (e.g., "3 pending snapshots," "Last search: 2h ago"). Summary data is overlaid on the card.
- **No custom component needed** — this is the key differentiator from Sparks. The Toolshop knows how to render every Card from metadata alone.

#### Spreelet Spark (built by author, plug-and-play)

- Rendered in the Toolshop's **Spark Launcher** — a modal dialog (default) or sidebar panel.
- Also embeddable on external sites (intranet, other apps) as a Web Component: `<spreelet-spark app="find-my-request" />`.
- Constrained to max width/height defined in the manifest.
- Must include a "Go to full app →" link that deep-links into the full Spreelet with current state.
- **Deep-link contract**: Spark state is serialized to URL search params. The full app URL accepts the same params and restores state.
- **Built using Spreelet Kit** components for consistency. The `spreelet-patterns` skill in the tech-ops plugin provides a Spark template that handles the embedding contract, deep-link serialization, and responsive constraints.
- **Spark bundles should be small** — target <20KB. They render core functionality only: search bar + results for Find My Request, KPI matrix + team selector for Team KPI Dashboard, snapshot generator for PM Helper.

#### Full App

- The Spreelet at its own URL, full navigation, all features.
- When opened from a Spark, receives state via URL search params — the transition is seamless.
- Can be used completely independently of the Toolshop.

### 2.4 Container Communication

When Sparks are loaded inside the Toolshop or on external sites, a lightweight message bus handles cross-cutting concerns:

```typescript
// Toolshop sends to Spark:
interface ToolshopMessage {
  type: 'theme-change' | 'auth-token' | 'navigate' | 'resize'
  payload: unknown
}

// Spark sends to Toolshop:
interface SparkMessage {
  type: 'open-full' | 'state-update' | 'request-resize' | 'entity-resolved'
  payload: unknown
}
```

For Web Component embedding, this uses `CustomEvent` dispatching. For iframe fallback, it uses `postMessage`. The Spreelet Kit provides a `useToolshop()` hook that abstracts this.

---

## 3. Design Patterns (Spreelet Kit)

### 3.1 Design Token Extensions

Spreelets use Spreeform's design system as their foundation. The Spreelet Kit extends Spreeform with domain-specific semantic tokens.

**All color values are CSS custom properties, not hardcoded hex values.** This is a hard requirement enforced by the `spreelet-readiness` skill.

#### Severity / Quality Tokens

```css
:root {
  /* Data Quality */
  --dq-clean: var(--successful);
  --dq-warning: var(--warning);
  --dq-blocker: var(--destructive);
  --dq-info: var(--primary);

  /* Freshness */
  --freshness-fresh: var(--successful);
  --freshness-aging: var(--warning);
  --freshness-stale: var(--destructive);

  /* Confidence */
  --confidence-high: var(--successful);
  --confidence-medium: var(--warning);
  --confidence-low: var(--muted);

  /* Trends */
  --trend-up: var(--successful);
  --trend-down: var(--destructive);
  --trend-flat: var(--muted);
}
```

#### Entity Type Colors

```css
:root {
  --entity-person: var(--primary);        /* blue family */
  --entity-team: var(--successful);       /* green family */
  --entity-project: #6366f1;             /* indigo — propose adding to Spreeform */
  --entity-topic: #8b5cf6;              /* purple — propose adding to Spreeform */
  --entity-timeframe: var(--muted);      /* gray family */
  --entity-metric: var(--warning);       /* amber family */
}
```

### 3.2 Shared Components

These components should behave identically across all Spreelets. They form the `@spreetail/spreelet-kit` package (or a shared directory in the tech-ops plugin until formalized).

#### StatusCapsule

Displays a normalized status with color-coded background.

- **States**: Not Started (muted), Active (primary), Waiting/Blocked (warning), Done (successful)
- **Variants**: `default` (pill with background), `outline` (border only), `dot` (color dot + text)
- **Props**: `status: NormalizedStatus`, `variant?: 'default' | 'outline' | 'dot'`, `showLabel?: boolean`

#### FreshnessIndicator

Shows how current a piece of data is.

- **Thresholds**: Fresh (≤5 min), Aging (5-30 min), Stale (>30 min) — configurable
- **Display**: Color dot + relative time label ("Just now", "12m ago", "2h ago")
- **Props**: `timestamp: string | Date`, `thresholds?: FreshnessThresholds`

#### ConfidenceBadge

Displays a confidence level for matches, predictions, or entity resolution.

- **Levels**: High (≥0.8), Medium (0.6-0.79), Low (0.4-0.59), Weak (<0.4)
- **Display**: Colored text + label ("Very likely", "Likely", "Possible", "Weak")
- **Props**: `score: number`, `showScore?: boolean`

#### TrendSparkline

Compact inline chart showing trend direction over a series of values.

- **Display**: SVG line chart, 72px × 24px, with endpoint marker
- **Colors**: Uses `--trend-up`, `--trend-down`, `--trend-flat` tokens
- **Props**: `values: number[]`, `direction?: 'up-good' | 'down-good' | 'neutral'`
- **Reference implementation**: Team KPI Dashboard sparkline (to be extracted)

#### SkeletonLoader

Animated placeholder while content loads.

- **Delay**: 500ms before showing (prevents flash on fast loads)
- **Variants**: `line` (text placeholder), `card` (card-shaped), `table` (rows of lines)
- **Props**: `variant: 'line' | 'card' | 'table'`, `count?: number`, `delay?: number`

#### ErrorBanner

Inline error display.

- **Display**: Full-width banner with AlertCircle icon, message, and optional retry action
- **Props**: `message: string`, `onRetry?: () => void`, `dismissible?: boolean`

#### EmptyState

Displayed when a list or search has no results.

- **Display**: Centered icon + message + optional action chips or CTA button
- **Props**: `icon?: LucideIcon`, `message: string`, `suggestions?: string[]`, `onSuggestionClick?: (s: string) => void`

#### EntityPill

Dismissible colored pill for displaying extracted entities.

- **Display**: Colored background (by entity type) + label + optional dismiss button (X)
- **Props**: `type: EntityType`, `label: string`, `onDismiss?: () => void`, `dismissible?: boolean`

#### EditableCell

Click-to-edit table cell with optimistic updates.

- **Display**: Static value that transforms to input on click, saves on blur/enter
- **Props**: `value: string | number`, `onSave: (newValue) => void`, `format?: 'number' | 'currency' | 'percent'`
- **Reference implementation**: Team KPI Dashboard estimate cells (to be extracted)

### 3.3 Layout Conventions

#### Content Width

| Layout Mode | Max Width | Use Case |
|---|---|---|
| Single column, reading | `max-w-3xl` (768px) | Search results, forms, detail views |
| Single column, working | `max-w-5xl` (1024px) | Dashboards, card grids |
| Two-panel | Full width | List + detail, search + results |
| Data table | `max-w-7xl` (1280px) | Tables with many columns, with horizontal scroll |
| Admin / wide dashboard | Full width with `px-6` padding | Multi-chart dashboards, wide KPI matrices |

#### Navigation

- **Inside the Toolshop**: The Toolshop provides global navigation. Spreelets embedded as Cards/Sparks do not render their own navigation.
- **Standalone**: Spreelets with multi-page navigation should use the Spreeform `Sidebar` block. Single-purpose tools (like Find My Request) can skip navigation.
- **Mobile**: Navigation collapses to a hamburger drawer below `md:` (768px). Handled by Spreeform Sidebar automatically.

#### Responsive Strategy

- **Breakpoint**: `md:` (768px) is the primary mobile/desktop break.
- **Tables**: Below `md:`, tables should either (a) switch to a card-based list view, or (b) enable horizontal scroll with a frozen key column. Prefer (a) for fewer than 20 rows, (b) for larger datasets.
- **Two-panel layouts**: Below `md:`, panels stack vertically. Selection opens a full-screen detail view with a back button (not a squished side-by-side).
- **Multi-column layouts** (like LTR Generator's chat + preview): Stack to single column below `md:` with tab switching between views.
- **Touch targets**: All interactive elements must be at least 44px × 44px on mobile (per WCAG 2.5.5).

### 3.4 Interaction Patterns

#### Search

Any Spreelet with a search function should follow this pattern:

1. Auto-focus the search input on page load
2. Show example queries or recent searches in the empty state below the input
3. Display a loading spinner inside the input during search
4. Render results as a vertical list of cards below the input
5. If entities are extracted from the query, show them as EntityPills in an interpretation bar between the input and results

Reference implementation: Find My Request.

#### Filtering

- **For ≤6 options**: Use toggle chips (horizontal row, multi-select). Active = filled primary, Inactive = outline.
- **For 7-20 options**: Use a dropdown select or multi-select.
- **For 20+ options**: Use a combobox with search (like PM Helper's TeamCombobox).
- **Filter state** should be reflected in URL search params for deep-linking.

#### Detail Drill-Down

When the user selects an item from a list to see more detail:

- **Preferred**: Right panel that slides in (Find My Request pattern). List shrinks but remains visible. On mobile, panel goes full-screen with back button.
- **Alternative**: Slide-over sheet from the right (Spreeform Sheet component). Use when the detail view is more transient.
- **Avoid**: Navigating to a new page for detail view. This loses list context.

#### Inline Editing

For editable data in tables (like KPI estimates):

- Click-to-edit pattern using the shared EditableCell component
- Optimistic updates (UI updates before server confirms)
- Visual indicator during save (subtle spinner or check mark)
- Esc to cancel, Enter or blur to save

#### Confirmation Dialogs

Any action that is destructive, irreversible, or has external side effects (push to Jira, bulk edit, export, publish) must use a confirmation dialog:

- Use Spreeform's AlertDialog component
- Title: Clear description of the action ("Push 5 edits to Jira?")
- Body: What will happen and any consequences
- Actions: Cancel (secondary) + Confirm (primary or destructive depending on action)

#### Loading States

- Use the shared SkeletonLoader with 500ms delay
- For mutations (save, generate, export): Use inline spinner on the trigger button + disable the button. Do not show a full-page loader.
- For initial page loads: Show skeleton for the primary content area. Navigation and chrome should render immediately.

---

## 4. Entity & Memory Architecture

### 4.1 Entity Domains in the Manifest

Each Spreelet declares its entity domains in `spreelet.json`. This serves double duty: it tells the Toolshop what the app works with, and it feeds the central Entity Registry.

```json
{
  "entities": {
    "owns": [
      {
        "domain": "issues",
        "types": ["issue", "epic", "story"],
        "description": "Jira issue lookup and status tracking",
        "schema": "entities/issues.schema.json"
      }
    ],
    "uses": [
      {
        "domain": "teams",
        "types": ["team"],
        "source": "trino:mrt_jira__operations_metrics_report"
      }
    ]
  }
}
```

- **`owns`**: Entity domains this Spreelet is the primary author of. It creates, updates, and maintains these entities.
- **`uses`**: Entity domains this Spreelet reads from but doesn't own. References the source system.

### 4.2 The Entity Registry

A central YAML file (`entity-registry.yaml`) in the tech-ops plugin aggregates entity domain declarations from all Spreelet manifests. This is the single source of truth for "what entity domains exist and who owns them."

```yaml
# entity-registry.yaml
# Auto-generated from Spreelet manifests. Do not edit directly.
# Regenerate with: spreelet-registry build

lastUpdated: "2026-03-09T00:00:00Z"

domains:
  teams:
    description: "Engineering teams at Spreetail"
    primaryOwner: pm-helper
    consumers:
      - find-my-request
      - team-kpi-dashboard
    types: [team]
    primarySource: "trino:mrt_jira__operations_metrics_report"
    schema:
      fields:
        - name: team_name
          type: string
          description: "Canonical team name"
        - name: team_id
          type: string
          description: "External identifier in source system"

  people:
    description: "People referenced across TechOps tools"
    primaryOwner: pm-helper
    consumers:
      - find-my-request
    types: [person]
    primarySource: "trino:mrt_jira__operations_metrics_report"

  issues:
    description: "Jira issues — status, ownership, lifecycle"
    primaryOwner: find-my-request
    consumers:
      - pm-helper
    types: [issue, epic, story]
    primarySource: "trino:jira__issue_enhanced"

  kpis:
    description: "Team-level KPI metrics by sprint"
    primaryOwner: team-kpi-dashboard
    consumers:
      - pm-helper
    types: [metric, sprint-metric]
    primarySource: "trino:mrt_jira__operations_metrics_report"

  roadmap-items:
    description: "Portfolio roadmap items across projects"
    primaryOwner: pm-helper
    consumers: []
    types: [roadmap-item, initiative]
    primarySource: "trino:various"

  snapshots:
    description: "Generated team performance snapshots"
    primaryOwner: pm-helper
    consumers: []
    types: [snapshot]
    primarySource: "postgres:pm-helper"

  estimates:
    description: "Story point planning estimates by team and sprint"
    primaryOwner: team-kpi-dashboard
    consumers: []
    types: [story-point-estimate]
    primarySource: "local:estimates.json"
    migrationNote: "Currently file-based. Should migrate to Postgres for multi-user."
```

### 4.3 Entity Schema (Shared Contract)

All Spreelets that persist entities to a database should use this schema:

```sql
CREATE TABLE entities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain         TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  external_id    TEXT,
  source_app     TEXT NOT NULL,
  confidence     NUMERIC(3,2) DEFAULT 1.0,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE entity_aliases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    UUID REFERENCES entities(id),
  alias        TEXT NOT NULL,
  alias_type   TEXT DEFAULT 'manual',
  confidence   NUMERIC(3,2) DEFAULT 0.8,
  usage_count  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE entity_edges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    UUID REFERENCES entities(id),
  target_id    UUID REFERENCES entities(id),
  relationship TEXT NOT NULL,
  source_app   TEXT NOT NULL,
  confidence   NUMERIC(3,2) DEFAULT 1.0,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE resolution_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id         UUID REFERENCES entities(id),
  input_text        TEXT NOT NULL,
  resolution_method TEXT NOT NULL,
  confidence        NUMERIC(3,2),
  accepted          BOOLEAN,
  source_app        TEXT NOT NULL,
  user_context      TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### 4.4 Resolution Algorithm (Reference)

Standardized from PM Helper's implementation:

1. **Exact match**: Look up `external_id` or `canonical_name`. Confidence: 1.0.
2. **Alias match**: Search `entity_aliases` table. Return highest-confidence alias.
3. **Fuzzy match**: Normalize input (lowercase, strip punctuation). Check substring inclusion (0.7). Calculate token overlap ratio (minimum 0.6 to qualify).
4. **Historical match**: Check `resolution_events` for past accepted resolutions of similar input.

### 4.5 Federation Model

**V1 (Now)**: Each Spreelet maintains its own entity tables in its own database. Schema is identical. The Entity Registry documents what exists where.

**V2 (Next)**: Each Spreelet exposes a read-only entity API:
```
GET /api/entities?type=team&q=data+management
GET /api/entities/:id
GET /api/entities/:id/edges
```

**V3 (Later)**: A coordination service fans out entity queries to multiple Spreelets and merges results. The `source_app` field enables deduplication and provenance tracking.

### 4.6 The `entity-domain` Skill

A skill in the tech-ops plugin that guides entity modeling:

1. Reads `entity-registry.yaml`
2. Identifies what entity domains the current app works with (by analyzing its data sources and UI)
3. Shows existing domains that could be reused — "The `teams` domain is already owned by PM Helper. Here's the schema. You can reference it."
4. Guides the author through declaring `owns`/`uses` in their manifest
5. Suggests where the app can leverage another app's entity work vs. carving its own path
6. Updates the manifest entity declarations

---

## 5. Tech-Ops Plugin Skills

### 5.1 `spreelet-patterns` (Build-Time Guidance)

**Trigger**: When building or modifying a Spreelet via the app-builder or Claude Code.

**What it provides**:
1. The Spreelet manifest spec — fields, levels, validation
2. The three-surface pattern — how to build Card metadata, Spark components, and Full App deep-linking
3. Spark component template — boilerplate for a Web Component Spark with Spreelet Kit, message bus, and deep-link serialization
4. The shared component inventory with usage examples
5. The semantic color tokens and when to use them
6. Layout conventions and responsive breakpoints
7. The entity schema contract and how to declare domains in the manifest

### 5.2 `spreelet-readiness` (Audit & Fix)

**Trigger**: Author asks "What do I need to do to make this a Spreelet?" or "Check my Spreelet readiness."

**What it does**:
1. Checks for `spreelet.json` manifest — generates one if missing
2. Scans for hardcoded hex colors — suggests Spreeform token replacements
3. Checks Spreelet Kit component usage vs. hand-built equivalents
4. Audits responsive design — flags missing `md:` breakpoints, no mobile layout
5. Checks server function validation (Zod schemas, input sanitization)
6. Reports a readiness score and a prioritized checklist
7. Can fix issues automatically with confirmation: generate manifest, swap colors, add responsive wrappers, add Zod validation

**Readiness Levels**:
- **Level 1**: Has manifest, uses Spreeform → appears in Toolshop as Card
- **Level 2**: Has Spark component, uses Spreelet Kit shared components, responsive design → full Spark integration
- **Level 3**: Declares entity domains, exposes entity API, has summary endpoint → full ecosystem integration

### 5.3 `entity-domain` (Entity Modeling)

**Trigger**: Author asks about entity management, data domains, or shared data.

**What it does**: See Section 4.6 above.

---

## 6. Initial Spreelets: The Tech Ops Toolshop Lineup

### 6.1 Find My Request

**Purpose**: Search for any Jira issue using natural language.
**Current state**: Most polished UX. Good mobile design. Search + progressive disclosure pattern.
**Entity domains**: Owns `issues`, uses `teams` and `people`.

| Priority | Change | Effort |
|---|---|---|
| P0 | Full-screen detail view with back button on mobile | Small |
| P0 | Create `spreelet.json` manifest | Small |
| P1 | Add `?surface=spark` mode (strip chrome, constrain layout) | Medium |
| P1 | Persist recent searches (feeds Card summary) | Small |
| P2 | Build Spark component (search bar + results in modal) | Medium |
| P2 | Pre-populate refinement chips from user history | Medium |
| P3 | Extract reusable components to Spreelet Kit | Medium |

### 6.2 PM Helper

**Purpose**: Portfolio management, snapshot reporting, data quality, roadmap exploration.
**Current state**: Feature-rich but desktop-focused. Hardcoded colors. Most mature entity system.
**Entity domains**: Owns `teams`, `people`, `roadmap-items`, `snapshots`, `metrics`. Uses `issues`.

| Priority | Change | Effort |
|---|---|---|
| P0 | Replace all hardcoded hex colors with Spreeform/Spreelet Kit tokens | Small |
| P0 | Create `spreelet.json` manifest with entity declarations | Small |
| P1 | Adopt 500ms-delayed skeleton loading pattern | Small |
| P1 | Add responsive card view for tables below `md:` breakpoint | Medium |
| P2 | Build Spark component (snapshot generator or roadmap summary) | Medium |
| P2 | Adopt right-panel detail pattern for entity management | Medium |
| P3 | Adopt Spreeform Sidebar block for navigation | Medium |

### 6.3 Team KPI Dashboard

**Purpose**: Sprint-over-sprint KPI matrix with inline estimates and AI-generated LTR reports.
**Current state**: Most used of the three. On the right stack but needs significant UX work. No mobile support. File-based persistence. SQL injection vulnerability.
**Entity domains**: Owns `kpis`, `estimates`. Uses `teams`, `sprints`.

| Priority | Change | Effort |
|---|---|---|
| P0 | Fix SQL injection in LTR team name interpolation | Small |
| P0 | Add responsive design (critical — desktop-only currently) | Medium |
| P0 | Create `spreelet.json` manifest | Small |
| P1 | Migrate file-based persistence (estimates, LTR) to Postgres | Medium |
| P1 | Replace hardcoded sparkline colors with Spreeform tokens | Small |
| P1 | Extract Sparkline as shared TrendSparkline component | Small |
| P1 | Extract EditableCell as shared component | Small |
| P2 | Add Zod validation to all server functions | Medium |
| P2 | Build Spark component (KPI summary for selected team) | Medium |
| P2 | LTR two-column layout: stack to single column on mobile with tab switch | Medium |
| P3 | Formalize LTR conversation phase as explicit state machine | Medium |
| P3 | Add streaming AI responses for LTR | Medium |

### 6.4 Cross-Cutting

| Priority | Change | Effort |
|---|---|---|
| P0 | Define and publish the Spreelet manifest JSON schema (with Zod validation) | Small |
| P0 | Write `spreelet-patterns` skill for tech-ops plugin | Medium |
| P1 | Build Spreelet Kit shared component package | Medium |
| P1 | Write `spreelet-readiness` skill for tech-ops plugin | Medium |
| P1 | Create `entity-registry.yaml` from initial three manifests | Small |
| P2 | Write `entity-domain` skill for tech-ops plugin | Medium |
| P2 | Build Tech Ops Toolshop V1 (registry, Cards, Spark Launcher, links to Full Apps) | Medium |
| P3 | Web Component wrapper for Spark embedding on external sites | Large |
| P3 | Usage analytics in the Toolshop | Medium |

---

## 7. Spreelet Creation Lifecycle

### Phase 1: Create Freely (Minutes)

Anyone builds a TechOps app using the app-builder or Claude Code with the tech-ops plugin. The `spreelet-patterns` skill nudges toward Spreeform and common patterns but doesn't block shipping.

**Output**: A working TanStack Start app on Kova.

### Phase 2: Surface It (Minutes)

Creator adds a `spreelet.json` manifest (minimum: id, name, description, URL, domain). The `spreelet-readiness` skill can generate this automatically.

**Output**: App appears in the Tech Ops Toolshop with a Spreelet Card.

### Phase 3: Enhance (Hours to Days)

If the Spreelet gets traction:
- Build a Spark component using the template from `spreelet-patterns`
- Adopt Spreelet Kit shared components
- Declare entity domains in manifest
- Add deep-link support
- Run `spreelet-readiness` to check remaining gaps

**Output**: Fully integrated Spreelet with Card, Spark, and entity federation.

### Phase 4: Converge (Ongoing)

When Spreelets overlap:
- Compare usage data to identify the stronger tool
- Port best patterns from each into the survivor
- The weaker tool either merges, specializes, or gets archived

This phase is organic and user-driven, not mandated.

---

## 8. Implementation Strategy

The standards defined here flow into the ecosystem through the **build process**, not through manual compliance:

1. **Tech-ops plugin** gets three new skills (`spreelet-patterns`, `spreelet-readiness`, `entity-domain`)
2. **App Builder** uses the tech-ops plugin → every new TechOps app is built with Spreelet conventions from the start
3. **Claude Code** users with the tech-ops plugin get the same guidance
4. **Existing apps** (Find My Request, PM Helper, Team KPI Dashboard) get retrofitted using the `spreelet-readiness` skill
5. **Toolshop V1** reads manifests and renders — proving the ecosystem works before investing in Sparks

This means the investment is front-loaded in the plugin skills, and then every subsequent app benefits automatically.

---

## Appendix A: Tech Stack Reference

| Layer | Technology | Notes |
|---|---|---|
| Meta-framework | TanStack Start | React 19 + SSR + Server Functions |
| Routing | TanStack Router | File-based, type-safe, search params for state |
| Data fetching | TanStack React Query v5 | Caching, background sync, deduplication |
| Styling | Tailwind CSS v4 | Via @tailwindcss/vite plugin |
| Component library | Spreeform (atoms + blocks) | Built on Radix UI + shadcn/ui |
| Spreelet components | Spreelet Kit | Extends Spreeform with TechOps patterns |
| Icons | lucide-react | Consistent icon set across ecosystem |
| Validation | Zod | Client + server schema validation |
| Database | PostgreSQL | Per-Spreelet, standardized entity schema |
| Data warehouse | Trino / Starburst Galaxy | Read-only analytics queries |
| Deployment | Kova (Kubernetes) | Multi-env: local k3d, EKS dev, EKS prod |
| Build | Vite + Bun | Fast dev server + production builds |
| Build guidance | Tech-ops plugin | Skills for patterns, readiness, entity modeling |

## Appendix B: File Structure Convention

```
my-spreelet/
├── spreelet.json                  # Spreelet manifest (required)
├── src/
│   ├── routes/                    # TanStack Router file-based routes
│   │   ├── __root.tsx             # Root layout
│   │   └── index.tsx              # Home page
│   ├── components/                # Feature-specific components
│   ├── surfaces/                  # Spark component (if applicable)
│   │   └── spark.tsx              # Compact interactive view
│   ├── server/
│   │   ├── config/                # Environment + connection config
│   │   ├── db/                    # Database queries + sanitization
│   │   ├── queries/               # Trino/data warehouse queries
│   │   └── services/              # Business logic
│   ├── types/                     # TypeScript interfaces
│   └── lib/                       # Utilities, shared helpers
├── entities/                      # Entity schema files (if applicable)
│   └── [domain].schema.json
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```
