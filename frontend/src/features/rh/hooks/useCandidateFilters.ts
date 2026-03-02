import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Candidate, CandidateStatus, CandidateFormData } from '../components/CandidateCard';

// Types
export interface CandidateFilters {
  search: string;
  status: string[];
  minScore: number;
  maxScore: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  skills: string[];
  sort: 'newest' | 'oldest' | 'score-desc' | 'score-asc' | 'name-asc';
}

// Re-export for convenience
export type { Candidate, CandidateStatus };

// Default filters
const DEFAULT_FILTERS: CandidateFilters = {
  search: '',
  status: [],
  minScore: 0,
  maxScore: 100,
  dateRange: {
    start: null,
    end: null,
  },
  skills: [],
  sort: 'newest',
};

// All available skills from candidates
export const AVAILABLE_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'JavaScript', 'Python',
  'Java', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
  'Vue.js', 'Angular', 'Next.js', 'GraphQL', 'Tailwind CSS',
  'Figma', 'Adobe XD', 'Agile', 'Scrum', 'CI/CD',
];

// Status options
export const STATUS_OPTIONS = [
  { value: 'Nouveau', label: 'Nouveau', color: '#3b82f6' },
  { value: 'En cours', label: 'En cours', color: '#8b5cf6' },
  { value: 'Archivé', label: 'Archivé', color: '#6b7280' },
  { value: 'Rejeté', label: 'Rejeté', color: '#ef4444' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'score-desc', label: 'Score décroissant' },
  { value: 'score-asc', label: 'Score croissant' },
  { value: 'name-asc', label: 'Nom A-Z' },
];

// Date presets
export const DATE_PRESETS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'all', label: 'Tout' },
];

// Score presets
export const SCORE_PRESETS = [
  { value: 'excellent', label: 'Excellent (80-100%)', min: 80, max: 100 },
  { value: 'good', label: 'Bon (60-79%)', min: 60, max: 79 },
  { value: 'fair', label: 'Moyen (40-59%)', min: 40, max: 59 },
];

// Custom hook for candidate filters
export function useCandidateFilters(candidates: Candidate[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse filters from URL
  const getFiltersFromParams = useCallback((): CandidateFilters => {
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const maxScore = parseInt(searchParams.get('maxScore') || '100');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];
    const sort = (searchParams.get('sort') as CandidateFilters['sort']) || 'newest';

    return {
      search,
      status: status ? status.split(',') : [],
      minScore,
      maxScore,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      skills,
      sort,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<CandidateFilters>(getFiltersFromParams);

  // Sync filters to URL when they change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.status.length) params.set('status', filters.status.join(','));
    if (filters.minScore > 0) params.set('minScore', filters.minScore.toString());
    if (filters.maxScore < 100) params.set('maxScore', filters.maxScore.toString());
    if (filters.dateRange.start) params.set('startDate', filters.dateRange.start);
    if (filters.dateRange.end) params.set('endDate', filters.dateRange.end);
    if (filters.skills.length) params.set('skills', filters.skills.join(','));
    if (filters.sort !== 'newest') params.set('sort', filters.sort);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Update filters from URL when URL changes
  useEffect(() => {
    setFilters(getFiltersFromParams());
  }, [getFiltersFromParams]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.phone.includes(filters.search)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter((c) => filters.status.includes(c.status));
    }

    // Score filter
    result = result.filter((c) => {
      const score = c.matchPercentage || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    // Date filter
    if (filters.dateRange.start) {
      result = result.filter(
        (c) => new Date(c.appliedDate) >= new Date(filters.dateRange.start!)
      );
    }
    if (filters.dateRange.end) {
      result = result.filter(
        (c) => new Date(c.appliedDate) <= new Date(filters.dateRange.end!)
      );
    }

    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter((c) => {
        const candidateSkills = c.formData?.skills || [];
        return filters.skills.some((skill) =>
          candidateSkills.some((cs) =>
            cs.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    }

    // Sort
    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());
        break;
      case 'score-desc':
        result.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
        break;
      case 'score-asc':
        result.sort((a, b) => (a.matchPercentage || 0) - (b.matchPercentage || 0));
        break;
      case 'name-asc':
        result.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        break;
    }

    return result;
  }, [candidates, filters]);

  // Update individual filter
  const updateFilter = useCallback(<K extends keyof CandidateFilters>(
    key: K,
    value: CandidateFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Get count of active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length) count++;
    if (filters.minScore > 0 || filters.maxScore < 100) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.skills.length) count++;
    if (filters.sort !== 'newest') count++;
    return count;
  }, [filters]);

  // Get status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Nouveau: 0,
      'En cours': 0,
      Archivé: 0,
      Rejeté: 0,
    };
    candidates.forEach((c) => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });
    return counts;
  }, [candidates]);

  return {
    filters,
    filteredCandidates,
    updateFilter,
    resetFilters,
    activeFilterCount,
    statusCounts,
  };
}

export default useCandidateFilters;
