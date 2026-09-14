'use client'

import { useI18n } from '@/lib/i18n/i18n-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, LayoutList, Kanban, Filter } from 'lucide-react'

interface HouseholdMemberOption {
  id: string
  displayName: string
}

interface TaskFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  scopeFilter: string
  onScopeFilterChange: (scope: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  assigneeFilter: string
  onAssigneeFilterChange: (assignee: string) => void
  viewMode: 'list' | 'kanban'
  onViewModeChange: (mode: 'list' | 'kanban') => void
  householdMembers?: HouseholdMemberOption[]
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  scopeFilter,
  onScopeFilterChange,
  statusFilter,
  onStatusFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  viewMode,
  onViewModeChange,
  householdMembers = [],
}: TaskFiltersProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('tasks.searchPlaceholder')}
            className="pl-10 rounded-2xl h-10 bg-card/70 border-border/60 text-xs font-medium focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center p-1 bg-muted/40 border border-border/40 rounded-2xl shrink-0 self-end sm:self-auto">
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => onViewModeChange('list')}
            className={`h-8 px-3 rounded-xl text-xs font-bold gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>{t('tasks.viewList')}</span>
          </Button>

          <Button
            size="sm"
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            onClick={() => onViewModeChange('kanban')}
            className={`h-8 px-3 rounded-xl text-xs font-bold gap-1.5 transition-all ${
              viewMode === 'kanban'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>{t('tasks.viewKanban')}</span>
          </Button>
        </div>
      </div>

      {/* Secondary Filter Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {/* Scope Filter */}
        <Select value={scopeFilter} onValueChange={(val) => val && onScopeFilterChange(val)}>
          <SelectTrigger className="rounded-xl h-9 text-xs bg-card/60 border-border/40 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">{t('tasks.filterScopeAll')}</SelectItem>
            <SelectItem value="household">{t('tasks.filterScopeHousehold')}</SelectItem>
            <SelectItem value="private">{t('tasks.filterScopePrivate')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter (Only relevant in List view) */}
        {viewMode === 'list' && (
          <Select value={statusFilter} onValueChange={(val) => val && onStatusFilterChange(val)}>
            <SelectTrigger className="rounded-xl h-9 text-xs bg-card/60 border-border/40 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('tasks.filterStatusAll')}</SelectItem>
              <SelectItem value="pending">{t('tasks.statusPending')}</SelectItem>
              <SelectItem value="in_progress">{t('tasks.statusInProgress')}</SelectItem>
              <SelectItem value="completed">{t('tasks.statusCompleted')}</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Assignee Filter */}
        <Select value={assigneeFilter} onValueChange={(val) => val && onAssigneeFilterChange(val)}>
          <SelectTrigger className="rounded-xl h-9 text-xs bg-card/60 border-border/40 font-medium col-span-2 sm:col-span-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">{t('tasks.filterAssigneeAll')}</SelectItem>
            {householdMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
