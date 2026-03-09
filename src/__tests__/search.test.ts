import { describe, expect, it } from 'vitest'
import type { SpreeletManifest } from '../types/manifest'

// Extract the filter logic so it can be tested independently
function filterSpreelets(
  spreelets: SpreeletManifest[],
  search: string,
): SpreeletManifest[] {
  const term = search.toLowerCase()
  return spreelets.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term) ||
      s.tags.some((t) => t.toLowerCase().includes(term)),
  )
}

const testSpreelets: SpreeletManifest[] = [
  {
    id: 'pm-helper',
    name: 'PM Helper',
    description: 'Generate LTR snapshots and manage roadmaps',
    icon: 'clipboard-list',
    version: '1.0.0',
    url: 'https://pm-helper.example.com',
    domain: 'tech-ops',
    tags: ['roadmap', 'kpis', 'snapshots'],
  },
  {
    id: 'sightline',
    name: 'Sightline',
    description: 'Search for any Jira issue using natural language',
    icon: 'search',
    version: '1.0.0',
    url: 'https://sightline.example.com',
    domain: 'tech-ops',
    tags: ['search', 'jira', 'issues'],
  },
  {
    id: 'team-kpi-dashboard',
    name: 'Team KPI Dashboard',
    description: 'Sprint-over-sprint KPI matrix with work breakdown',
    icon: 'bar-chart-3',
    version: '1.0.0',
    url: 'https://kpi.example.com',
    domain: 'tech-ops',
    tags: ['kpis', 'sprints', 'metrics'],
  },
]

describe('filterSpreelets', () => {
  it('returns all spreelets when search is empty', () => {
    expect(filterSpreelets(testSpreelets, '')).toHaveLength(3)
  })

  it('matches by name', () => {
    const result = filterSpreelets(testSpreelets, 'sightline')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sightline')
  })

  it('matches by name case-insensitively', () => {
    const result = filterSpreelets(testSpreelets, 'PM')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('pm-helper')
  })

  it('matches by description', () => {
    const result = filterSpreelets(testSpreelets, 'jira')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sightline')
  })

  it('matches by tags', () => {
    const result = filterSpreelets(testSpreelets, 'sprints')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('team-kpi-dashboard')
  })

  it('matches across multiple spreelets when tag is shared', () => {
    const result = filterSpreelets(testSpreelets, 'kpis')
    expect(result).toHaveLength(2)
    const ids = result.map((s) => s.id)
    expect(ids).toContain('pm-helper')
    expect(ids).toContain('team-kpi-dashboard')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterSpreelets(testSpreelets, 'nonexistent')).toHaveLength(0)
  })

  it('matches partial substrings in description', () => {
    const result = filterSpreelets(testSpreelets, 'snapshot')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('pm-helper')
  })
})
