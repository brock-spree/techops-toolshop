import { createServerFn } from '@tanstack/react-start'
import {
  RegistrySchema,
  SpreeletManifestSchema,
  type ResolvedManifest,
  type ResolvedRegistry,
  type RegistryEntry,
} from '../types/manifest'
import registryData from '../data/registry.json'

const FETCH_TIMEOUT_MS = 3000

/**
 * Resolve relative URLs in a manifest against the origin it was fetched from.
 * This makes manifests portable — apps use relative paths like "/api/summary"
 * and the Toolshop resolves them based on where the manifest lives.
 */
function resolveManifestUrls(
  manifest: ReturnType<typeof SpreeletManifestSchema.parse>,
  manifestUrl: string,
): void {
  let origin: string
  try {
    origin = new URL(manifestUrl).origin
  } catch {
    return // Can't resolve if manifestUrl isn't a valid URL
  }

  const resolve = (path: string) =>
    path.startsWith('/') ? `${origin}${path}` : path

  if (manifest.url) manifest.url = resolve(manifest.url)
  if (manifest.surfaces?.card?.summaryEndpoint) {
    manifest.surfaces.card.summaryEndpoint = resolve(manifest.surfaces.card.summaryEndpoint)
  }
  if (manifest.surfaces?.spark?.component) {
    manifest.surfaces.spark.component = resolve(manifest.surfaces.spark.component)
  }
  if (manifest.surfaces?.full?.url) {
    manifest.surfaces.full.url = resolve(manifest.surfaces.full.url)
  }
}

async function fetchManifest(
  entry: RegistryEntry,
): Promise<ResolvedManifest> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(entry.manifestUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const manifest = SpreeletManifestSchema.parse(data)

    if (manifest.id !== entry.id) {
      throw new Error(
        `Manifest id mismatch: expected "${entry.id}" but got "${manifest.id}"`,
      )
    }

    resolveManifestUrls(manifest, entry.manifestUrl)

    return { manifest, source: 'live' }
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Unknown fetch error'

    if (entry.fallback) {
      return {
        manifest: entry.fallback,
        source: 'fallback',
        error: `Live fetch failed (${error}), using fallback`,
      }
    }

    throw new Error(
      `Failed to fetch manifest for ${entry.id} and no fallback available: ${error}`,
    )
  }
}

export const getRegistry = createServerFn({ method: 'GET' }).handler(
  async () => {
    const registry = RegistrySchema.parse(registryData)

    const results = await Promise.all(
      registry.spreelets.map((entry) => fetchManifest(entry)),
    )

    const resolved: ResolvedRegistry = {
      domain: registry.domain,
      spreelets: results,
    }

    return resolved
  },
)
