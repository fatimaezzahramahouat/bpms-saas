import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, X, ChevronDown, RotateCcw, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { JobOfferModal } from '../components/JobOfferModal';

// Filter state interface
interface FilterState {
  search: string;
  status: 'all' | 'active' | 'paused' | 'closed';
  contractType: 'all' | 'CDI' | 'CDD' | 'Stage' | 'Freelance' | 'Alternance';
  department: 'all' | 'Développement' | 'Marketing' | 'RH' | 'Design' | 'Finance' | 'Commercial';
  sort: 'createdAt:desc' | 'createdAt:asc' | 'applicationsCount:desc' | 'title:asc';
}

// Job offer interface
interface JobOffer {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  type: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  createdAt: string;
  requirements?: string[];
  applicationsCount?: number;
}

// Filter options
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actif' },
  { value: 'paused', label: 'En pause' },
  { value: 'closed', label: 'Fermé' },
];

const CONTRACT_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Alternance', label: 'Alternance' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'Développement', label: 'Développement' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'RH', label: 'RH' },
  { value: 'Design', label: 'Design' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Commercial', label: 'Commercial' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Plus récents' },
  { value: 'createdAt:asc', label: 'Plus anciens' },
  { value: 'applicationsCount:desc', label: 'Plus de candidatures' },
  { value: 'title:asc', label: 'Titre A-Z' },
];

// Pagination options
const PAGE_LIMITS = [9, 18, 27];

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function JobOffersManagement() {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Modal state - used for edit mode
  const [editingJob, setEditingJob] = useState<JobOffer | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    contractType: 'all',
    department: 'all',
    sort: 'createdAt:desc',
  });

  // Debounced search value (300ms)
  const debouncedSearch = useDebounce(filters.search, 300);

  // Update filter value
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      contractType: 'all',
      department: 'all',
      sort: 'createdAt:desc',
    });
  }, []);

  // Count active filters (excluding 'all' and default sort)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.contractType !== 'all') count++;
    if (filters.department !== 'all') count++;
    return count;
  }, [filters]);

  // Get status display label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      CLOSED: 'Fermé',
      DRAFT: 'Brouillon',
      active: 'Actif',
      paused: 'En pause',
      closed: 'Fermé',
    };
    return labels[status] || status;
  };

  // Map API status to display status
  const mapStatusToApi = (status: string): 'ACTIVE' | 'CLOSED' | 'DRAFT' => {
    const mapping: Record<string, 'ACTIVE' | 'CLOSED' | 'DRAFT'> = {
      active: 'ACTIVE',
      paused: 'DRAFT',
      closed: 'CLOSED',
    };
    return mapping[status] || 'DRAFT';
  };

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobOffers];

    // Search filter (debounced)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.department.toLowerCase().includes(searchLower) ||
        (job.requirements?.some(req => req.toLowerCase().includes(searchLower)) ?? false)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      const apiStatus = mapStatusToApi(filters.status);
      result = result.filter(job => job.status === apiStatus);
    }

    // Contract type filter
    if (filters.contractType !== 'all') {
      result = result.filter(job => job.type === filters.contractType);
    }

    // Department filter
    if (filters.department !== 'all') {
      result = result.filter(job => job.department === filters.department);
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'createdAt:desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAt:asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'applicationsCount:desc':
          return (b.applicationsCount || 0) - (a.applicationsCount || 0);
        case 'title:asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [jobOffers, debouncedSearch, filters.status, filters.contractType, filters.department, filters.sort]);

  // Reset page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Pagination calculations
  const totalItems = filteredAndSortedJobs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedJobs = filteredAndSortedJobs.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Generate active filter tags
  const activeFilterTags = useMemo(() => {
    const tags: { key: keyof FilterState; value: string; label: string }[] = [];

    if (filters.search) {
      tags.push({ key: 'search', value: filters.search, label: `Recherche: "${filters.search}"` });
    }
    if (filters.status !== 'all') {
      const statusOption = STATUS_OPTIONS.find(opt => opt.value === filters.status);
      tags.push({ key: 'status', value: filters.status, label: `Statut: ${statusOption?.label}` });
    }
    if (filters.contractType !== 'all') {
      tags.push({ key: 'contractType', value: filters.contractType, label: `Contrat: ${filters.contractType}` });
    }
    if (filters.department !== 'all') {
      tags.push({ key: 'department', value: filters.department, label: `Département: ${filters.department}` });
    }

    return tags;
  }, [filters]);

  // Remove single filter tag
  const removeFilterTag = (key: keyof FilterState) => {
    if (key === 'search') {
      updateFilter('search', '');
    } else if (key === 'status') {
      updateFilter('status', 'all');
    } else if (key === 'contractType') {
      updateFilter('contractType', 'all');
    } else if (key === 'department') {
      updateFilter('department', 'all');
    }
  };

  useEffect(() => {
    // Simulated data - in production, this would come from an API
    const mockData: JobOffer[] = [
      {
        id: '1',
        title: 'Développeur Frontend',
        description: 'Nous recherchons un développeur Frontend expérimenté pour rejoindre notre équipe.',
        department: 'Développement',
        location: 'Casablanca',
        type: 'CDI',
        status: 'ACTIVE',
        createdAt: '2024-01-15',
        requirements: ['React', 'TypeScript', '3+ ans expérience'],
        applicationsCount: 12,
      },
      {
        id: '2',
        title: 'Chef de Projet',
        description: 'Gestion de projets IT avec méthodologie Agile.',
        department: 'Gestion',
        location: 'Rabat',
        type: 'CDI',
        status: 'ACTIVE',
        createdAt: '2024-01-20',
        requirements: ['PMP', 'Agile', '5+ ans expérience'],
        applicationsCount: 8,
      },
      {
        id: '3',
        title: 'Designer UI/UX',
        description: 'Création dinterfaces utilisateur modernes et intuitives.',
        department: 'Design',
        location: 'Casablanca',
        type: 'CDI',
        status: 'ACTIVE',
        createdAt: '2024-02-01',
        requirements: ['Figma', 'Adobe XD', '3+ ans expérience'],
        applicationsCount: 15,
      },
      {
        id: '4',
        title: 'Stagiaire Marketing',
        description: 'Stage de 6 mois en marketing digital.',
        department: 'Marketing',
        location: 'Rabat',
        type: 'Stage',
        status: 'DRAFT',
        createdAt: '2024-02-05',
        requirements: ['Bac+3', 'Marketing digital'],
        applicationsCount: 3,
      },
      {
        id: '5',
        title: 'Développeur Backend',
        description: 'Maintenance et développement de nos API.',
        department: 'Développement',
        location: 'Casablanca',
        type: 'CDI',
        status: 'CLOSED',
        createdAt: '2023-12-10',
        requirements: ['Node.js', 'PostgreSQL', '5+ ans expérience'],
        applicationsCount: 20,
      },
    ];
    setJobOffers(mockData);
    setIsLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
      CLOSED: 'bg-red-500/20 text-red-400 border-red-500/30',
      DRAFT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return styles[status as keyof typeof styles] || styles.DRAFT;
  };

  // Custom select component
  const Select = ({ 
    value, 
    onChange, 
    options, 
    className = '' 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    options: { value: string; label: string }[];
    className?: string;
  }) => (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-2 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des offres d'emploi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos offres d'emploi et candidatures
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nouvelle offre
        </button>
      </div>

      {/* Search Bar with Debounce */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, département ou compétence..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-4">
        {/* Toggle Filters Button (Mobile) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#8000ff] transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filtres</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#8000ff] text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter Controls */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Status Filter */}
            <div className="w-40">
              <Select
                value={filters.status}
                onChange={(value) => updateFilter('status', value as FilterState['status'])}
                options={STATUS_OPTIONS}
              />
            </div>

            {/* Contract Type Filter */}
            <div className="w-40">
              <Select
                value={filters.contractType}
                onChange={(value) => updateFilter('contractType', value as FilterState['contractType'])}
                options={CONTRACT_OPTIONS}
              />
            </div>

            {/* Department Filter */}
            <div className="w-40">
              <Select
                value={filters.department}
                onChange={(value) => updateFilter('department', value as FilterState['department'])}
                options={DEPARTMENT_OPTIONS}
              />
            </div>

            {/* Sort Options */}
            <div className="w-48">
              <Select
                value={filters.sort}
                onChange={(value) => updateFilter('sort', value as FilterState['sort'])}
                options={SORT_OPTIONS}
              />
            </div>

            {/* Reset Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#8000ff] hover:bg-[#8000ff]/10 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
            )}

            {/* Active Filter Count */}
            {activeFilterCount > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Active Filter Tags */}
          {activeFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilterTags.map((tag) => (
                <div
                  key={tag.key}
                  className="flex items-center gap-2 px-3 py-1 bg-[#8000ff]/10 text-[#8000ff] dark:text-[#8000ff] rounded-full text-sm"
                >
                  <span>{tag.label}</span>
                  <button
                    onClick={() => removeFilterTag(tag.key)}
                    className="p-0.5 hover:bg-[#8000ff]/20 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#8000ff]/30 border-t-[#8000ff] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                <Search className="w-full h-full" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune offre d'emploi trouvée
              </p>
              {activeFilterCount > 0 ? (
                <button
                  onClick={resetFilters}
                  className="text-[#8000ff] hover:text-[#6a00cc] font-medium"
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  className="text-[#8000ff] hover:text-[#6a00cc] font-medium"
                >
                  Ajouter votre première offre
                </button>
              )}
            </div>
          ) : (
            <>
              {paginatedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-[#8000ff]/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#8000ff]" />
                          {job.department}
                        </span>
                        <span>{job.location}</span>
                        <span>{job.type}</span>
                        <span>Créée le {job.createdAt}</span>
                        {job.applicationsCount !== undefined && (
                          <Link
                            to={`/dashboard/rh/job-offers/${job.id}/candidats`}
                            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 hover:bg-[#8000ff]/10 hover:text-[#8000ff] transition-colors cursor-pointer"
                          >
                            {job.applicationsCount} candidature{job.applicationsCount > 1 ? 's' : ''}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="p-2 text-gray-500 hover:text-[#8000ff] hover:bg-[#8000ff]/10 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingJob(job);
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-500 hover:text-[#8000ff] hover:bg-[#8000ff]/10 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Affichage par:</span>
            <div className="w-20">
              <Select
                value={String(itemsPerPage)}
                onChange={(value) => setItemsPerPage(Number(value))}
                options={PAGE_LIMITS.map(limit => ({ value: String(limit), label: String(limit) }))}
              />
            </div>
          </div>

          {/* Pagination info */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Affichage {startIndex + 1}-{endIndex} sur {totalItems} offres
          </div>

          {/* Page numbers and navigation */}
          <div className="flex items-center gap-1">
            {/* Previous button */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#8000ff] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-2 text-gray-400">
                  {page}
                </span>
              )
            ))}

            {/* Next button */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedJob.title}
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedJob.status)}`}>
                  {getStatusLabel(selectedJob.status)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">{selectedJob.department}</span>
                <span className="text-gray-500 dark:text-gray-400">{selectedJob.location}</span>
                <span className="text-gray-500 dark:text-gray-400">{selectedJob.type}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedJob.description}</p>
              </div>
              {selectedJob.requirements && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Job Modal */}
      <JobOfferModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingJob(null);
        }}
        onSuccess={() => {
          // Refresh the job list after successful save
          // In a real app, this would refetch from API
        }}
        initialData={editingJob || undefined}
      />
    </div>
  );
}
