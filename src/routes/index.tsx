import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { getRegistry } from '../server/registry'
import { ToolshopHeader } from '../components/ToolshopHeader'
import { CardGrid } from '../components/CardGrid'
import { SparkLauncher } from '../components/SparkLauncher'
import type { ResolvedManifest } from '../types/manifest'

const searchSchema = z.object({
  search: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  component: HomePage,
})

function filterSpreelets(
  spreelets: ResolvedManifest[],
  search: string,
): ResolvedManifest[] {
  const term = search.toLowerCase()
  return spreelets.filter(
    (s) =>
      s.manifest.name.toLowerCase().includes(term) ||
      s.manifest.description.toLowerCase().includes(term) ||
      s.manifest.tags.some((t) => t.toLowerCase().includes(term)),
  )
}

function HomePage() {
  const { search } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [sparkTarget, setSparkTarget] = useState<ResolvedManifest | null>(null)

  const { data: registry, isLoading } = useQuery({
    queryKey: ['registry'],
    queryFn: () => getRegistry(),
    staleTime: 5 * 60 * 1000,
  })

  const spreelets = registry?.spreelets ?? []
  const filtered = search ? filterSpreelets(spreelets, search) : spreelets

  return (
    <div className="min-h-screen">
      <ToolshopHeader
        search={search ?? ''}
        onSearchChange={(value) =>
          navigate({ search: { search: value || undefined } })
        }
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <CardGrid
          spreelets={filtered}
          isLoading={isLoading}
          onQuickOpen={setSparkTarget}
        />
      </main>
      <SparkLauncher
        resolved={sparkTarget}
        onClose={() => setSparkTarget(null)}
      />
    </div>
  )
}
