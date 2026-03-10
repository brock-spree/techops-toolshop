import { describe, expect, it } from 'vitest'
import {
  SpreeletManifestSchema,
  RegistrySchema,
  CardSummarySchema,
} from '../types/manifest'
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
  it('validates the static registry.json with entry format', () => {
    const result = RegistrySchema.parse(registryData)
    expect(result.domain).toBe('tech-ops')
    expect(result.spreelets).toHaveLength(3)
  })

  it('each entry has manifestUrl and fallback', () => {
    const result = RegistrySchema.parse(registryData)
    for (const entry of result.spreelets) {
      expect(entry.manifestUrl).toMatch(/^https?:\/\//)
      expect(entry.fallback).toBeDefined()
      expect(entry.fallback!.id).toBe(entry.id)
    }
  })

  it('contains all expected Spreelets', () => {
    const result = RegistrySchema.parse(registryData)
    const ids = result.spreelets.map((s) => s.id)
    expect(ids).toContain('keystone')
    expect(ids).toContain('sightline')
    expect(ids).toContain('left-to-right')
  })
})

describe('CardSummarySchema', () => {
  it('validates a valid summary response', () => {
    const summary = {
      items: [
        { label: 'Pending snapshots', value: '3' },
        { label: 'Last generated', value: '2h ago' },
      ],
      updatedAt: '2026-03-09T12:00:00Z',
    }
    const result = CardSummarySchema.parse(summary)
    expect(result.items).toHaveLength(2)
    expect(result.updatedAt).toBeDefined()
  })

  it('allows summary without updatedAt', () => {
    const summary = {
      items: [{ label: 'Active users', value: '12' }],
    }
    expect(CardSummarySchema.parse(summary).items).toHaveLength(1)
  })

  it('rejects summary with missing items', () => {
    expect(() => CardSummarySchema.parse({})).toThrow()
  })
})
