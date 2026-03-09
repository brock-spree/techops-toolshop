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
  summaryEndpoint: z.string().url(),
  refreshInterval: z.number().positive(),
})

const SparkSurfaceSchema = z.object({
  component: z.string().url(),
  preferredSurface: z.enum(['modal', 'panel']),
  maxWidth: z.number().positive(),
  maxHeight: z.number().positive(),
})

const FullSurfaceSchema = z.object({
  url: z.string().url(),
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
  url: z.string().url(),
  domain: z.string(),
  tags: z.array(z.string()),
  surfaces: SurfacesSchema.optional(),
  entities: EntitiesSchema.optional(),
  capabilities: z.array(z.string()).optional(),
})

export type SpreeletManifest = z.infer<typeof SpreeletManifestSchema>

// Registry shape
export const RegistrySchema = z.object({
  domain: z.string(),
  spreelets: z.array(SpreeletManifestSchema),
})

export type Registry = z.infer<typeof RegistrySchema>
