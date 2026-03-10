import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  Badge,
  Button,
} from '@spreetail/spreeform'
import { ArrowRight, Box, Zap, WifiOff } from 'lucide-react'
import { resolveIcon } from '../lib/icons'
import { getSummary } from '../server/summary'
import type { ResolvedManifest } from '../types/manifest'

interface SpreeletCardProps {
  resolved: ResolvedManifest
  onQuickOpen?: (resolved: ResolvedManifest) => void
}

export function SpreeletCard({ resolved, onQuickOpen }: SpreeletCardProps) {
  const { manifest, source, error } = resolved
  const Icon = resolveIcon(manifest.icon) ?? Box
  const hasSpark = !!manifest.surfaces?.spark
  const summaryEndpoint = manifest.surfaces?.card?.summaryEndpoint
  const refreshInterval = manifest.surfaces?.card?.refreshInterval ?? 300

  const { data: summary } = useQuery({
    queryKey: ['summary', manifest.id],
    queryFn: () => getSummary({ data: summaryEndpoint! }),
    enabled: !!summaryEndpoint,
    refetchInterval: refreshInterval * 1000,
    staleTime: refreshInterval * 1000,
  })

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{manifest.name}</CardTitle>
              {source === 'fallback' && (
                <span
                  title={error ?? 'Using cached manifest data'}
                  className="text-muted-foreground"
                >
                  <WifiOff className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <CardDescription className="mt-1">
              {manifest.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {manifest.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {summary && summary.items.length > 0 && (
          <div className="space-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
            {summary.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild variant="default" size="sm">
          <a href={manifest.url} target="_blank" rel="noopener noreferrer">
            Open
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </Button>
        {hasSpark && onQuickOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickOpen(resolved)}
          >
            <Zap className="mr-1 h-4 w-4" />
            Quick open
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
