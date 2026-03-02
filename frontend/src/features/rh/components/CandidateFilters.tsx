import { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, Check, Calendar, SlidersHorizontal, RefreshCcw } from 'lucide-react';
import { useCandidateFilters, STATUS_OPTIONS, SORT_OPTIONS, DATE_PRESETS, SCORE_PRESETS, AVAILABLE_SKILLS } from '../hooks/useCandidateFilters';

interface CandidateFiltersProps {
  filters: ReturnType<typeof useCandidateFilters>['filters'];
  updateFilter: ReturnType<typeof useCandidateFilters>['updateFilter'];
  resetFilters: ReturnType<typeof useCandidateFilters>['resetFilters'];
  statusCounts: ReturnType<typeof useCandidateFilters>['statusCounts'];
  activeFilterCount: number;
}

export function CandidateFilters({
  filters,
  updateFilter,
  resetFilters,
  statusCounts,
  activeFilterCount,
}: CandidateFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'score' | 'date' | 'skills' | 'sort'>('status');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply date preset
  const handleDatePreset = (preset: string) => {
    const today = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (preset) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        startDate = null;
        endDate = null;
        break;
    }

    updateFilter('dateRange', { start: startDate, end: endDate });
  };

  // Apply score preset
  const handleScorePreset = (preset: typeof SCORE_PRESETS[0]) => {
    updateFilter('minScore', preset.min);
    updateFilter('maxScore', preset.max);
  };

  // Toggle status
  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    updateFilter('status', newStatus);
  };

  // Toggle skill
  const toggleSkill = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    updateFilter('skills', newSkills);
  };

  const tabs = [
    { id: 'status', label: 'Statut', icon: SlidersHorizontal },
    { id: 'score', label: 'Score', icon: SlidersHorizontal },
    { id: 'date', label: 'Date', icon: Calendar },
    { id: 'skills', label: 'Compétences', icon: SlidersHorizontal },
    { id: 'sort', label: 'Trier', icon: SlidersHorizontal },
  ] as const;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
          isOpen || activeFilterCount > 0
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-purple-500'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtres</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 bg-white text-purple-600 text-xs font-bold rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border-color)] overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-500 border-b-2 border-purple-500 bg-purple-500/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleStatus(option.value)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      filters.status.includes(option.value)
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-[var(--border-color)] hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">
                        ({statusCounts[option.value] || 0})
                      </span>
                      {filters.status.includes(option.value) && (
                        <Check className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Score Tab */}
            {activeTab === 'score' && (
              <div className="space-y-4">
                {/* Presets */}
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-secondary)]">Préréglages</p>
                  {SCORE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleScorePreset(preset)}
                      className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                        filters.minScore === preset.min && filters.maxScore === preset.max
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-[var(--border-color)] text-[var(--text-primary)] hover:border-purple-500/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-secondary)]">Personnalisé</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={filters.minScore}
                      onChange={(e) => updateFilter('minScore', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded text-sm text-center"
                      placeholder="Min"
                    />
                    <span className="text-[var(--text-secondary)]">-</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={filters.maxScore}
                      onChange={(e) => updateFilter('maxScore', parseInt(e.target.value) || 100)}
                      className="w-20 px-2 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded text-sm text-center"
                      placeholder="Max"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Date Tab */}
            {activeTab === 'date' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-secondary)]">Période</p>
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleDatePreset(preset.value)}
                      className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                        preset.value === 'all' && !filters.dateRange.start
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-[var(--border-color)] text-[var(--text-primary)] hover:border-purple-500/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-secondary)]">Dates personnalisées</p>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateRange.start || ''}
                      onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value || null })}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-sm"
                      placeholder="Date début"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end || ''}
                      onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value || null })}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-sm"
                      placeholder="Date fin"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">Sélectionner les compétences</p>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {AVAILABLE_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2 py-1 rounded-full text-xs transition-colors ${
                        filters.skills.includes(skill)
                          ? 'bg-purple-600 text-white'
                          : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:bg-purple-500/20 hover:text-purple-400'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Tab */}
            {activeTab === 'sort' && (
              <div className="space-y-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateFilter('sort', option.value as any)}
                    className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                      filters.sort === option.value
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                        : 'border-[var(--border-color)] text-[var(--text-primary)] hover:border-purple-500/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {activeFilterCount > 0 && (
            <div className="p-3 border-t border-[var(--border-color)]">
              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-purple-400 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CandidateFilters;
