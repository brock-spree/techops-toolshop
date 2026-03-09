import { createServerFn } from '@tanstack/react-start'
import { RegistrySchema } from '../types/manifest'
import registryData from '../data/registry.json'

export const getRegistry = createServerFn({ method: 'GET' }).handler(
  async () => {
    const registry = RegistrySchema.parse(registryData)
    return registry
  },
)
