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
import { ArrowRight, Box } from 'lucide-react'
import { resolveIcon } from '../lib/icons'
import type { SpreeletManifest } from '../types/manifest'

interface SpreeletCardProps {
  manifest: SpreeletManifest
}

export function SpreeletCard({ manifest }: SpreeletCardProps) {
  const Icon = resolveIcon(manifest.icon) ?? Box

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{manifest.name}</CardTitle>
            <CardDescription className="mt-1">
              {manifest.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1.5">
          {manifest.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild variant="default" size="sm">
          <a href={manifest.url} target="_blank" rel="noopener noreferrer">
            Open
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
