import { Search } from 'lucide-react'
import { Input } from '@spreetail/spreeform'

interface ToolshopHeaderProps {
  search: string
  onSearchChange: (value: string) => void
}

export function ToolshopHeader({ search, onSearchChange }: ToolshopHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-xl font-semibold text-foreground whitespace-nowrap">
          Tech Ops Toolshop
        </h1>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </header>
  )
}
