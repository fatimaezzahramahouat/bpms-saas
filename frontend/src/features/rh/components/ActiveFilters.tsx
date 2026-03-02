import { X, Filter, User, Calendar, Target, Percent, Hash } from 'lucide-react';
import { useCandidateFilters, STATUS_OPTIONS } from '../hooks/useCandidateFilters';

interface ActiveFiltersProps {
  filters: ReturnType<typeof useCandidateFilters>['filters'];
  updateFilter: ReturnType<typeof useCandidateFilters>['updateFilter'];
  resetFilters: ReturnType<typeof useCandidateFilters>['resetFilters'];
}

export function ActiveFilters({ filters, updateFilter, resetFilters }: ActiveFiltersProps) {
  // Get active filter tags
  const activeTags: { label: string; value: string; onRemove: () => void }[] = [];

  // Search
  if (filters.search) {
    activeTags.push({
      label: `Recherche: "${filters.search}"`,
      value: 'search',
      onRemove: () => updateFilter('search', ''),
    });
  }

  // Status
  filters.status.forEach((status) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    if (option) {
      activeTags.push({
        label: option.label,
        value: `status-${status}`,
        onRemove: () =>
          updateFilter(
            'status',
            filters.status.filter((s) => s !== status)
          ),
      });
    }
  });

  // Score
  if (filters.minScore > 0 || filters.maxScore < 100) {
    activeTags.push({
      label: `Score: ${filters.minScore}-${filters.maxScore}%`,
      value: 'score',
      onRemove: () => {
        updateFilter('minScore', 0);
        updateFilter('maxScore', 100);
      },
    });
  }

  // Date
  if (filters.dateRange.start || filters.dateRange.end) {
    const dateLabel = filters.dateRange.start && filters.dateRange.end
      ? `${filters.dateRange.start} - ${filters.dateRange.end}`
      : filters.dateRange.start
      ? `À partir de ${filters.dateRange.start}`
      : `Jusqu'à ${filters.dateRange.end}`;
    activeTags.push({
      label: dateLabel,
      value: 'date',
      onRemove: () => updateFilter('dateRange', { start: null, end: null }),
    });
  }

  // Skills
  filters.skills.forEach((skill) => {
    activeTags.push({
      label: skill,
      value: `skill-${skill}`,
      onRemove: () =>
        updateFilter(
          'skills',
          filters.skills.filter((s) => s !== skill)
        ),
    });
  });

  if (activeTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
        <Filter className="w-4 h-4" />
        <span>Filtres actifs:</span>
      </div>
      
      {activeTags.map((tag) => (
        <span
          key={tag.value}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-400"
        >
          <span>{tag.label}</span>
          <button
            onClick={tag.onRemove}
            className="p-0.5 hover:bg-purple-500/20 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      <button
        onClick={resetFilters}
        className="text-sm text-[var(--text-secondary)] hover:text-purple-400 transition-colors underline"
      >
        Tout effacer
      </button>
    </div>
  );
}

export default ActiveFilters;
