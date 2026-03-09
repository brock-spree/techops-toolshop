import { icons, type LucideIcon } from 'lucide-react'

// Lucide renamed some icons in v0.4+. Map legacy names to current ones.
const LEGACY_ALIASES: Record<string, string> = {
  'bar-chart-3': 'chart-bar',
  'bar-chart-2': 'chart-column',
  'bar-chart': 'chart-column-big',
  'line-chart': 'chart-line',
  'area-chart': 'chart-area',
}

/**
 * Resolves a kebab-case icon name (e.g. "clipboard-list") to a lucide-react component.
 * Returns undefined if the icon name doesn't match any known icon.
 */
export function resolveIcon(name: string): LucideIcon | undefined {
  const resolved = LEGACY_ALIASES[name] ?? name

  // Convert kebab-case to PascalCase: "clipboard-list" -> "ClipboardList"
  const pascalCase = resolved
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')

  return icons[pascalCase as keyof typeof icons]
}
