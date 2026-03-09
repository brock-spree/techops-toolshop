# ADR-001: Toolshop Architecture and Spreelet Integration Model

**Status:** Proposed
**Date:** 2026-03-09 (updated)
**Decision Makers:** Brock Butler
**Context Contributors:** Claude (analysis and recommendation)

---

## Context

Spreetail's TechOps team is building a growing set of small, focused web applications ("Spreelets") that help technology professionals work more effectively. Three exist today — PM Helper (portfolio management and snapshot reporting), Find My Request (natural language Jira issue search), and Team KPI Dashboard (sprint metrics and AI-generated LTR reports) — with more expected as the team grows from a pilot to 20 and eventually 100+ users.

These apps share a common tech stack (TanStack Start, Spreeform, Kova), data sources (Trino/Starburst Galaxy), and audience (Spreetail engineering and product teams). But they were built independently and have diverged in UX patterns, color systems, loading behaviors, responsive design, and navigation — creating friction for users who cross between them.

Additionally, we want to:
- Make it easy for many people to create new Spreelets quickly (innovation > uniformity)
- Surface all available tools in a discoverable location, scoped by domain
- Allow Spreelets to be used in constrained contexts (modals, embedded on other sites) via "Sparks"
- Share capabilities like entity resolution across apps without tight coupling
- Establish patterns that guide future development through the build process (App Builder + tech-ops plugin), not manual compliance
- Support multiple Toolshop instances for different domains (Tech Ops first, others later)

## Decision Drivers

1. **Low barrier to entry**: Creating a new Spreelet and making it discoverable should take minutes, not days.
2. **No deploy coupling**: Adding or updating a Spreelet should not require changes to the Toolshop.
3. **Progressive integration**: Apps can start minimal (manifest only → Card) and grow (Spark → entity federation) as they prove value.
4. **UX consistency**: Users crossing between tools should not encounter gratuitous differences.
5. **Independent evolution**: Each Spreelet ships on its own cadence.
6. **Embeddability**: Spreelets should be usable on the intranet, in other apps, and in Toolshops.
7. **Build-process enforcement**: Standards flow through the App Builder + tech-ops plugin, not manual checklists.
8. **Domain scoping**: The Toolshop pattern should be reusable across domains, not locked to Tech Ops.

## Options Considered

### Option A: Single Monolith App with Routes

All Spreelets are routes within one TanStack Start application.

**Assessment:** Rejected. Every new Spreelet requires modifying and deploying the monolith. One broken Spreelet blocks all. Discourages experimentation. Cannot embed Spreelets elsewhere. Violates drivers #1, #2, #5, #6.

### Option B: Pure Iframe Container

The Toolshop renders iframes pointing to each Spreelet's URL.

**Assessment:** Rejected as primary model. Iframes are janky (scrolling, focus, resizing). Cannot do interactive work on the card surface. Cross-origin postMessage is fragile. Poor mobile behavior. However, acceptable as V1 fallback for Spark embedding while Web Component approach is developed.

### Option C: Registry-Driven with Two-Tier Surfaces (Selected)

The Toolshop reads a registry of Spreelet manifests. **Spreelet Cards** are rendered automatically from manifest metadata (no custom code needed). **Spreelet Sparks** are dynamically loaded Web Component bundles built by the Spreelet author. Full app access is via navigation.

This is a refinement of the original "dynamic component loading" approach, with an important distinction: Cards are zero-code (generated from metadata), while Sparks are the investment that comes with traction.

**Pros:**
- Spreelet Cards require zero code — just publish a manifest
- Sparks are built using templates from the `spreelet-patterns` skill — plug-and-play
- No Toolshop code changes when adding Spreelets
- Sparks are Web Components — embeddable anywhere (Toolshop, intranet, other apps)
- Full apps remain standalone
- Progressive: Card → Spark → Entity Federation
- Domain-scoped via environment variable — one codebase, multiple Toolshop instances

**Cons:**
- Spark building requires per-Spreelet work (mitigated by skill templates)
- Web Component loading has CORS implications on Kova
- Contract between Toolshop and Sparks needs maintenance

**Assessment:** Selected. Best balance of zero-barrier entry (Cards) and rich integration (Sparks). The build-process enforcement strategy (App Builder + plugin skills) ensures consistency without manual compliance.

### Option D: Micro-Frontend with Module Federation

**Assessment:** Rejected. Overkill for current scale (3 apps growing to ~10). Version skew, debugging complexity, and infrastructure overhead aren't justified yet. Revisit if >15 Spreelets with shared dependency concerns.

## Decision

**We will use Option C: Registry-Driven with Two-Tier Surfaces.**

### Surface Model

| Surface | Code Required | Rendered By | Purpose |
|---|---|---|---|
| **Spreelet Card** | None (manifest only) | Toolshop | Discovery, browsing, basic info |
| **Spreelet Spark** | Web Component bundle | Toolshop Spark Launcher / external embed | Quick, focused interaction without leaving context |
| **Full App** | Full Spreelet codebase | Own URL | Complete experience with all features |

### Implementation Phases

**V1 (Now):** Static registry (JSON). Spreelet Cards rendered from manifest metadata. Full app access via link navigation. No Sparks yet.

**V2 (Next):** Spark Launcher in Toolshop. Dynamic Web Component loading for Sparks. Card summary endpoint polling for live data. `spreelet-patterns` and `spreelet-readiness` skills in tech-ops plugin.

**V3 (Later):** Web Component wrappers for Spark embedding on external sites. Entity federation via entity APIs. Usage analytics in Toolshop. Additional Toolshop domain instances.

### Domain Scoping

The Toolshop is parameterized by domain:
```
TOOLSHOP_DOMAIN=tech-ops
```

One codebase, multiple instances. Each instance reads a domain-specific registry and applies domain branding. The Tech Ops Toolshop is the first instance. Other domains can create their own without forking the codebase.

## Consequences

### Positive

- New Spreelets appear in the Toolshop by publishing a manifest (5-minute effort)
- Cards are zero-code; Sparks are guided by plugin skills with templates
- Standards are enforced through the build process, not manual review
- Each Spreelet remains independently deployable
- The Toolshop naturally becomes a discovery and usage analytics surface
- Entity Registry (aggregated from manifests) enables future federation without upfront investment
- Domain scoping allows the pattern to expand beyond Tech Ops

### Negative

- Spark development adds a second build artifact per Spreelet (the Web Component bundle)
- Manifest schema becomes a contract that needs versioning
- Web Component CORS configuration needed on Kova
- V1 has no Sparks — only Cards linking to full apps

### Risks

- **Adoption risk**: If few people create Spreelets, the ecosystem investment doesn't pay off. Mitigation: The App Builder + plugin already produce Spreelets as default output for TechOps apps. Existing apps get retrofitted using `spreelet-readiness`.
- **Fragmentation risk**: If Spreelets diverge too much, UX consistency fails. Mitigation: `spreelet-patterns` skill provides active guidance during creation. Spreelet Kit shared components make consistency the path of least resistance. `spreelet-readiness` audits existing apps.
- **Performance risk**: Many Sparks loaded dynamically could be slow. Mitigation: Lazy load. Target <20KB per Spark bundle. Cache aggressively.

## Related Decisions

- Entity schema and federation model (see Spec, Section 4)
- Spreelet Kit component library (see Spec, Section 3)
- Tech-ops plugin skills: `spreelet-patterns`, `spreelet-readiness`, `entity-domain` (see Spec, Section 5)
- Team KPI Dashboard facelift priorities (see Spec, Section 6.3)

---

*This ADR follows the format described in Michael Nygard's "Documenting Architecture Decisions" (2011).*
