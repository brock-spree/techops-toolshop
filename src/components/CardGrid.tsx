import { Skeleton } from '@spreetail/spreeform'
import { SpreeletCard } from './SpreeletCard'
import type { SpreeletManifest } from '../types/manifest'

interface CardGridProps {
  spreelets: SpreeletManifest[]
  isLoading?: boolean
}

export function CardGrid({ spreelets, isLoading }: CardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border p-6">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (spreelets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">No tools found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different search term
        </p>
      </div>
    )
  }

  const sorted = [...spreelets].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((manifest) => (
        <SpreeletCard key={manifest.id} manifest={manifest} />
      ))}
    </div>
  )
}
