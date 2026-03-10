import { describe, expect, it } from 'vitest'
import type { ResolvedManifest } from '../types/manifest'

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

function makeResolved(
  id: string,
  name: string,
  description: string,
  tags: string[],
): ResolvedManifest {
  return {
    manifest: {
      id,
      name,
      description,
      icon: 'box',
      version: '1.0.0',
      url: `https://${id}.example.com`,
      domain: 'tech-ops',
      tags,
    },
    source: 'live',
  }
}

const testSpreelets: ResolvedManifest[] = [
  makeResolved(
    'pm-helper',
    'PM Helper',
    'Generate LTR snapshots and manage roadmaps',
    ['roadmap', 'kpis', 'snapshots'],
  ),
  makeResolved(
    'sightline',
    'Sightline',
    'Search for any Jira issue using natural language',
    ['search', 'jira', 'issues'],
  ),
  makeResolved(
    'team-kpi-dashboard',
    'Team KPI Dashboard',
    'Sprint-over-sprint KPI matrix with work breakdown',
    ['kpis', 'sprints', 'metrics'],
  ),
]

describe('filterSpreelets', () => {
  it('returns all spreelets when search is empty', () => {
    expect(filterSpreelets(testSpreelets, '')).toHaveLength(3)
  })

  it('matches by name', () => {
    const result = filterSpreelets(testSpreelets, 'sightline')
    expect(result).toHaveLength(1)
    expect(result[0].manifest.id).toBe('sightline')
  })

  it('matches by name case-insensitively', () => {
    const result = filterSpreelets(testSpreelets, 'PM')
    expect(result).toHaveLength(1)
    expect(result[0].manifest.id).toBe('pm-helper')
  })

  it('matches by description', () => {
    const result = filterSpreelets(testSpreelets, 'jira')
    expect(result).toHaveLength(1)
    expect(result[0].manifest.id).toBe('sightline')
  })

  it('matches by tags', () => {
    const result = filterSpreelets(testSpreelets, 'sprints')
    expect(result).toHaveLength(1)
    expect(result[0].manifest.id).toBe('team-kpi-dashboard')
  })

  it('matches across multiple spreelets when tag is shared', () => {
    const result = filterSpreelets(testSpreelets, 'kpis')
    expect(result).toHaveLength(2)
    const ids = result.map((s) => s.manifest.id)
    expect(ids).toContain('pm-helper')
    expect(ids).toContain('team-kpi-dashboard')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterSpreelets(testSpreelets, 'nonexistent')).toHaveLength(0)
  })

  it('matches partial substrings in description', () => {
    const result = filterSpreelets(testSpreelets, 'snapshot')
    expect(result).toHaveLength(1)
    expect(result[0].manifest.id).toBe('pm-helper')
  })
})
