import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Badge,
} from '@spreetail/spreeform'
import {
  ArrowLeft,
  Telescope,
  Diamond,
  LayoutGrid,
  UserRoundSearch,
  ArrowRight,
  Layers,
  Sparkles,
  Maximize2,
} from 'lucide-react'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

const SUITE_APPS = [
  {
    name: 'Sightline',
    tagline: 'See across the horizon',
    description:
      'Cross-team visibility into sprints, blockers, and delivery health. Surfaces the work that matters across all teams.',
    icon: Telescope,
    status: 'live' as const,
    step: 'Understand the Work',
  },
  {
    name: 'Prism',
    tagline: 'Clarity from complexity',
    description:
      'Stakeholder communications, roadmap management, and exploring points and EBITDA impact. Organizes chaos into clarity.',
    icon: Diamond,
    status: 'live' as const,
    step: 'Align Priorities',
  },
  {
    name: 'Array',
    tagline: 'The pattern of progress',
    description:
      'KPI matrices, trend analysis, and work breakdown tracking. Reveals patterns that drive better decisions.',
    icon: LayoutGrid,
    status: 'live' as const,
    step: 'Data-Driven Improvement',
  },
  {
    name: 'Focal',
    tagline: 'Bring the person into focus',
    description:
      'Individual focus, burnout signals, and growth tracking. Because great products are built by supported people.',
    icon: UserRoundSearch,
    status: 'planned' as const,
    step: 'Grow & Develop our People',
  },
]

const SURFACES = [
  {
    name: 'Card',
    icon: Layers,
    description: 'At-a-glance summaries embedded in the Toolshop dashboard',
  },
  {
    name: 'Spark',
    icon: Sparkles,
    description: 'Quick-open overlays for fast interactions without leaving context',
  },
  {
    name: 'Full',
    icon: Maximize2,
    description: 'Standalone app experiences for deep-dive analysis and workflows',
  },
]

function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Toolshop
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <section className="mb-12">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Product & Engineering Intelligence
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tech Optics
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Turn noisy data from Jira, GitLab, ReadAI, Teams, Email, and other
            tech tools into clear, actionable signal.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The Tech Optics Suite is a set of Spreelets built for Product,
            Engineering, and Tech leaders across Spreetail. Each tool focuses on
            a distinct portion of the delivery lifecycle, working together to
            provide deep intelligence across Spreetail.
          </p>
        </section>

        {/* Workflow Narrative */}
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            The Workflow
          </h2>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-5 py-4 text-sm font-medium">
            {SUITE_APPS.map((app, i) => (
              <span key={app.name} className="flex items-center gap-2">
                <span className="text-foreground">{app.step}</span>
                {i < SUITE_APPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            ))}
          </div>
        </section>

        {/* Suite Apps */}
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            The Suite
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SUITE_APPS.map((app) => {
              const Icon = app.icon
              return (
                <Card key={app.name} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {app.name}
                          </CardTitle>
                          <Badge
                            variant={
                              app.status === 'live' ? 'default' : 'outline'
                            }
                            className="text-xs"
                          >
                            {app.status === 'live' ? 'Live' : 'Planned'}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1 italic">
                          &ldquo;{app.tagline}&rdquo;
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {app.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-primary">
                      {app.step}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Surfaces */}
        <section className="mb-12">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            How It Works
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            The Toolshop is a unified access layer. Every tool in the Tech
            Optics Suite can appear in up to three surfaces, giving you the
            right level of detail for the moment.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SURFACES.map((surface) => {
              const Icon = surface.icon
              return (
                <div
                  key={surface.name}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {surface.name}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {surface.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
