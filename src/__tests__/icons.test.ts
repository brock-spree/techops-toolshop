import { describe, expect, it } from 'vitest'
import { resolveIcon } from '../lib/icons'

describe('resolveIcon', () => {
  it('resolves a simple kebab-case icon', () => {
    expect(resolveIcon('search')).toBeDefined()
  })

  it('resolves a multi-word kebab-case icon', () => {
    expect(resolveIcon('clipboard-list')).toBeDefined()
  })

  it('resolves legacy bar-chart-3 to chart-bar', () => {
    const icon = resolveIcon('bar-chart-3')
    expect(icon).toBeDefined()
  })

  it('resolves other legacy chart aliases', () => {
    expect(resolveIcon('bar-chart-2')).toBeDefined()
    expect(resolveIcon('line-chart')).toBeDefined()
    expect(resolveIcon('area-chart')).toBeDefined()
  })

  it('resolves layout-grid (toolshop icon)', () => {
    expect(resolveIcon('layout-grid')).toBeDefined()
  })

  it('returns undefined for unknown icons', () => {
    expect(resolveIcon('totally-fake-icon')).toBeUndefined()
  })
})
