import { describe, expect, it } from 'vitest'
import { SpreeletManifestSchema, RegistrySchema } from '../types/manifest'
import registryData from '../data/registry.json'

describe('SpreeletManifestSchema', () => {
  it('validates a Level 1 manifest (minimum fields)', () => {
    const level1 = {
      id: 'test-app',
      name: 'Test App',
      description: 'A test application',
      icon: 'box',
      version: '1.0.0',
      url: 'https://test.example.com',
      domain: 'tech-ops',
      tags: ['test'],
    }
    expect(SpreeletManifestSchema.parse(level1)).toEqual(level1)
  })

  it('validates a Level 3 manifest with surfaces, entities, and capabilities', () => {
    const level3 = {
      id: 'full-app',
      name: 'Full App',
      description: 'A fully integrated app',
      icon: 'layout-grid',
      version: '2.0.0',
      url: 'https://full.example.com',
      domain: 'tech-ops',
      tags: ['full', 'integrated'],
      surfaces: {
        card: {
          summaryEndpoint: 'https://full.example.com/api/summary',
          refreshInterval: 300,
        },
        spark: {
          component: 'https://full.example.com/spark.js',
          preferredSurface: 'modal' as const,
          maxWidth: 480,
          maxHeight: 640,
        },
        full: {
          url: 'https://full.example.com',
          deepLinkParams: ['team', 'view'],
        },
      },
      entities: {
        owns: [
          {
            domain: 'items',
            types: ['item'],
            description: 'Item management',
          },
        ],
        uses: [
          {
            domain: 'teams',
            types: ['team'],
            source: 'pm-helper',
          },
        ],
      },
      capabilities: ['search', 'export'],
    }
    const result = SpreeletManifestSchema.parse(level3)
    expect(result.surfaces?.spark?.preferredSurface).toBe('modal')
    expect(result.entities?.owns).toHaveLength(1)
    expect(result.capabilities).toContain('search')
  })

  it('rejects a manifest missing required fields', () => {
    const invalid = {
      id: 'broken',
      name: 'Broken',
    }
    expect(() => SpreeletManifestSchema.parse(invalid)).toThrow()
  })

  it('rejects an invalid URL', () => {
    const invalid = {
      id: 'bad-url',
      name: 'Bad URL',
      description: 'Has a bad URL',
      icon: 'box',
      version: '1.0.0',
      url: 'not-a-url',
      domain: 'tech-ops',
      tags: [],
    }
    expect(() => SpreeletManifestSchema.parse(invalid)).toThrow()
  })
})

describe('RegistrySchema', () => {
  it('validates the static registry.json', () => {
    const result = RegistrySchema.parse(registryData)
    expect(result.domain).toBe('tech-ops')
    expect(result.spreelets).toHaveLength(3)
  })

  it('contains all expected Spreelets', () => {
    const result = RegistrySchema.parse(registryData)
    const ids = result.spreelets.map((s) => s.id)
    expect(ids).toContain('pm-helper')
    expect(ids).toContain('find-my-request')
    expect(ids).toContain('team-kpi-dashboard')
  })
})
