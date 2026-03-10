# ADR-002: Spreelet Kit as a Shared NPM Package

**Status:** Accepted
**Date:** 2026-03-09
**Decision Makers:** Brock Butler
**Context Contributors:** Claude (analysis and implementation)

---

## Context

The Spreelet standards spec (Section 3) defines two categories of shared design assets:

1. **Semantic design tokens** — CSS custom properties that map Spreeform's base tokens to domain-specific meanings (data quality, freshness, confidence, trends, entity types)
2. **Shared components** — 9 React components that should look and behave identically across all TechOps Spreelets (StatusCapsule, FreshnessIndicator, ConfidenceBadge, TrendSparkline, EntityPill, EditableCell, SkeletonLoader, ErrorBanner, EmptyState)

These assets need to be consumed by multiple independently-deployed apps. The question is how to distribute them.

## Decision Drivers

1. **Single source of truth**: Tokens and components should be defined once, not copied across apps
2. **Independent deployment**: Updating shared assets shouldn't require coordinated deploys
3. **Minimal coupling**: Apps should be able to adopt the kit incrementally
4. **Consistent with existing infrastructure**: Spreetail already publishes `@spreetail/spreeform` to ProGet
5. **Extensibility**: More components and tokens will be added as the ecosystem grows

## Options Considered

### Option A: Extend Spreeform Directly

Add the semantic tokens and TechOps components to the existing `@spreetail/spreeform` package.

**Pros:** Single dependency, no new package to manage.
**Cons:** Spreeform is a general-purpose design system used beyond TechOps. Adding domain-specific tokens (data quality, entity types) pollutes the global scope. Non-TechOps apps would inherit tokens they don't use. The Spreeform team would need to review and maintain TechOps-specific components.

**Assessment:** Rejected. Wrong level of abstraction. Spreeform is the foundation; the kit is a domain extension.

### Option B: New `@spreetail/spreelet-kit` Package (Selected)

Publish a separate package to the same ProGet registry under the `@spreetail` scope. Peer-depends on Spreeform.

**Pros:** Clean separation of concerns. Publishable via existing infrastructure. Apps opt in explicitly. Tokens reference Spreeform variables, so dark mode works automatically. Extensible — new components and tokens can be added without touching Spreeform.

**Cons:** One more dependency per app. Apps need to import both Spreeform and the kit.

**Assessment:** Selected. Right level of abstraction, minimal overhead.

### Option C: Shared CSS File in the Monorepo

Put tokens in a shared directory that apps import via relative path.

**Pros:** Zero package management overhead.
**Cons:** Only works within the monorepo. Can't be used by apps in other repos. No versioning. Components can't be shared this way (only CSS). Breaks if directory structure changes.

**Assessment:** Rejected. Too fragile, doesn't support component sharing.

### Option D: Copy-Paste Convention

Document the tokens and let each app copy them into their own CSS.

**Pros:** No infrastructure needed.
**Cons:** Drift between apps. No component reuse. Manual sync required when tokens change. Exactly the problem the Spreelet standards are trying to solve.

**Assessment:** Rejected. Doesn't scale.

## Decision

**Use Option B: Publish `@spreetail/spreelet-kit` as a separate package to ProGet.**

### Package Design

**Three import paths** for granular adoption:

| Import | Contents | Use Case |
|--------|----------|----------|
| `@spreetail/spreelet-kit` | Components + tokens + utilities | Full adoption |
| `@spreetail/spreelet-kit/tokens` | CSS custom properties only | Apps that just need semantic colors |
| `@spreetail/spreelet-kit/utilities` | Tailwind @utility classes only | Apps that want `text-dq-clean` etc. |

**Token architecture:** All semantic tokens delegate to Spreeform base variables. This means:
- Dark mode works automatically for most tokens
- If Spreeform updates its color palette, the kit inherits the changes
- Two exceptions (entity-project indigo, entity-topic purple) use hardcoded hex with explicit `.dark` overrides, tracked until Spreeform adds these colors

**Peer dependencies:** React, Spreeform, lucide-react — all already present in every Spreelet. No new transitive dependencies.

**Build:** Vite library mode producing ES + UMD bundles with TypeScript declarations. Externalizes all peer dependencies.

## Consequences

### Positive

- Tokens and components are defined once and versioned
- Apps adopt incrementally: tokens first, components as needed
- Consistent with the existing `@spreetail/spreeform` publishing workflow
- The `spreelet-readiness` skill can check for kit adoption programmatically
- Dark mode support comes free through token delegation
- Component props are TypeScript-typed with JSDoc documentation

### Negative

- One more package to publish and version
- Apps need `@import '@spreetail/spreelet-kit/tokens'` in addition to Spreeform import
- Two hardcoded hex values need manual dark mode management until Spreeform adds indigo/purple

### Risks

- **Adoption lag**: If apps don't add the dependency, tokens stay copy-pasted. Mitigation: The `spreelet-readiness` skill checks for kit adoption and flags it as an issue.
- **Version drift**: Different apps on different kit versions. Mitigation: Semver + peer dependency on Spreeform ensures compatibility. Breaking changes bump major version.
- **Over-engineering**: 9 components for 3 apps might be premature. Mitigation: Components are extracted from real implementations in existing apps (Team KPI Dashboard sparklines, Find My Request entity pills). They're solving proven needs, not hypothetical ones.

## Related Decisions

- ADR-001: Toolshop Architecture (establishes the Spreelet ecosystem model)
- Spreelet Standards Spec, Section 3 (defines the tokens and component inventory)
- `spreelet-patterns` skill TOKENS.md (documents token usage for developers)
