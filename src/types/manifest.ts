import { z } from 'zod'

// Entity domain declaration
const EntityDomainSchema = z.object({
  domain: z.string(),
  types: z.array(z.string()),
  description: z.string().optional(),
  schema: z.string().optional(),
  source: z.string().optional(),
})

// Surface definitions
const CardSurfaceSchema = z.object({
  summaryEndpoint: z.string(), // Absolute or relative — resolved against manifest source
  refreshInterval: z.number().positive(),
})

const SparkSurfaceSchema = z.object({
  component: z.string(), // Absolute or relative — resolved against manifest source
  preferredSurface: z.enum(['modal', 'panel']),
  maxWidth: z.number().positive(),
  maxHeight: z.number().positive(),
})

const FullSurfaceSchema = z.object({
  url: z.string(), // Absolute or relative — resolved against manifest source
  deepLinkParams: z.array(z.string()).optional(),
})

const SurfacesSchema = z.object({
  card: CardSurfaceSchema.optional(),
  spark: SparkSurfaceSchema.optional(),
  full: FullSurfaceSchema.optional(),
})

const EntitiesSchema = z.object({
  owns: z.array(EntityDomainSchema).optional(),
  uses: z.array(EntityDomainSchema).optional(),
})

// Full manifest — Level 1 fields required, Level 2/3 optional
export const SpreeletManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  version: z.string(),
  url: z.string(), // Absolute or relative — resolved against manifest source
  domain: z.string(),
  tags: z.array(z.string()),
  surfaces: SurfacesSchema.optional(),
  entities: EntitiesSchema.optional(),
  capabilities: z.array(z.string()).optional(),
})

export type SpreeletManifest = z.infer<typeof SpreeletManifestSchema>

// Registry entry — points to a manifest URL, with optional inline fallback
export const RegistryEntrySchema = z.object({
  id: z.string(),
  manifestUrl: z.string().url(),
  fallback: SpreeletManifestSchema.optional(),
})

export type RegistryEntry = z.infer<typeof RegistryEntrySchema>

// Registry shape (source file)
export const RegistrySchema = z.object({
  domain: z.string(),
  spreelets: z.array(RegistryEntrySchema),
})

export type Registry = z.infer<typeof RegistrySchema>

// Resolved manifest with fetch metadata
export interface ResolvedManifest {
  manifest: SpreeletManifest
  source: 'live' | 'fallback'
  error?: string
}

// Resolved registry returned to the client
export interface ResolvedRegistry {
  domain: string
  spreelets: ResolvedManifest[]
}

// Summary endpoint response
export const CardSummarySchema = z.object({
  items: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  updatedAt: z.string().optional(),
})

export type CardSummary = z.infer<typeof CardSummarySchema>
