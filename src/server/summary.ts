import { createServerFn } from '@tanstack/react-start'
import { CardSummarySchema, type CardSummary } from '../types/manifest'

const FETCH_TIMEOUT_MS = 3000

export const getSummary = createServerFn({ method: 'GET' })
  .inputValidator((input: string) => {
    // Validate it's a URL
    new URL(input)
    return input
  })
  .handler(async ({ data: summaryUrl }): Promise<CardSummary | null> => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      const response = await fetch(summaryUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeout)

      if (!response.ok) return null

      const data = await response.json()
      return CardSummarySchema.parse(data)
    } catch {
      return null
    }
  })
