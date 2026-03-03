import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, X, ChevronDown, RotateCcw, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import { JobOfferModal } from '../components/JobOfferModal';
import { jobOfferService, JobOffer, JobOfferFilters } from '../../../services/jobOffer.service';

// Filter state interface
interface FilterState {
  search: string;
  status: 'all' | 'ACTIVE' | 'CLOSED' | 'DRAFT';
  contractType: 'all' | 'CDI' | 'CDD' | 'Stage' | 'Freelance' | 'Alternance';
  sort: 'createdAt:desc' | 'createdAt:asc' | 'title:asc';
}

// Filter options
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'PUBLISHED', label: 'Publié' },
  { value: 'PAUSED', label: 'En pause' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'CANCELLED', label: 'Annulé' },
];

const CONTRACT_OPTIONS = [
  { value: 'all', label: 'Tous les contrats' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Alternance', label: 'Alternance' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Plus récents' },
  { value: 'createdAt:asc', label: 'Plus anciens' },
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
  const [totalItems, setTotalItems] = useState(0);
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
    sort: 'createdAt:desc',
  });

  // State for status update feedback
  const [statusToast, setStatusToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounced search value (300ms)
  const debouncedSearch = useDebounce(filters.search, 300);

  // Fetch job offers function
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sortBy, sortOrder] = filters.sort.split(':');
      const apiParams: JobOfferFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        contractType: filters.contractType !== 'all' ? filters.contractType : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const response = await jobOfferService.getRHOffers(apiParams);
      
      setJobOffers(response.data);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, filters.contractType, filters.sort, filters.status]);

  // Handle manual status change
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await jobOfferService.updateOffer(jobId, { status: newStatus as any });
      setStatusToast({ type: 'success', message: 'Statut mis à jour avec succès' });
      fetchJobs(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating status:', error);
      setStatusToast({ 
        type: 'error', 
        message: error.response?.data?.error || 'Erreur lors de la mise à jour du statut' 
      });
    } finally {
      // Auto-hide toast after 3 seconds
      setTimeout(() => setStatusToast(null), 3000);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Update filter value
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      contractType: 'all',
      sort: 'createdAt:desc',
    });
    setCurrentPage(1);
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.contractType !== 'all') count++;
    return count;
  }, [filters]);

  // Get status display label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      PUBLISHED: 'Publié',
      PAUSED: 'En pause',
      CANCELLED: 'Annulé',
      FILLED: 'Pourvu',
      CLOSED: 'Fermé',
      // Legacy support if needed
      ACTIVE: 'Publié',
    };
    return labels[status] || status;
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + jobOffers.length, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const handleEditJob = (job: JobOffer) => {
    // Need to handle the potential type mismatch between components/types
    setEditingJob(job);
    setShowModal(true);
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await jobOfferService.deleteOffer(id);
        fetchJobs();
      } catch (error) {
        alert('Erreur lors de la suppression de l\'offre');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
      PUBLISHED: 'bg-green-500/20 text-green-400 border-green-500/30',
      PAUSED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      CANCELLED: 'bg-red-500/20 text-red-600 border-red-500/30',
      FILLED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return styles[status as keyof typeof styles] || styles.DRAFT;
  };

  // Active filter tags
  const activeFilterTags = useMemo(() => {
    const tags: { key: keyof FilterState; value: string; label: string }[] = [];
    if (filters.search) tags.push({ key: 'search', value: filters.search, label: `Recherche: "${filters.search}"` });
    if (filters.status !== 'all') {
      const statusOption = STATUS_OPTIONS.find(opt => opt.value === filters.status);
      tags.push({ key: 'status', value: filters.status, label: `Statut: ${statusOption?.label}` });
    }
    if (filters.contractType !== 'all') tags.push({ key: 'contractType', value: filters.contractType, label: `Contrat: ${filters.contractType}` });
    return tags;
  }, [filters]);

  const removeFilterTag = (key: keyof FilterState) => {
    if (key === 'search') updateFilter('search', '');
    else if (key === 'status') updateFilter('status', 'all');
    else if (key === 'contractType') updateFilter('contractType', 'all');
  };

  // Custom Select
  const Select = ({ value, onChange, options, className = '' }: any) => (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-2 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all cursor-pointer"
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des offres d'emploi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez vos offres d'emploi et candidatures</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors font-medium"
        >
          <Plus className="w-5 h-5" /> Nouvelle offre
        </button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all"
          />
          {filters.search && (
            <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-40"><Select value={filters.status} onChange={(v: any) => updateFilter('status', v)} options={STATUS_OPTIONS} /></div>
          <div className="w-40"><Select value={filters.contractType} onChange={(v: any) => updateFilter('contractType', v)} options={CONTRACT_OPTIONS} /></div>
          <div className="w-48"><Select value={filters.sort} onChange={(v: any) => updateFilter('sort', v)} options={SORT_OPTIONS} /></div>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#8000ff]">
              <RotateCcw className="w-4 h-4" /> Réinitialiser
            </button>
          )}
        </div>

        {activeFilterTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilterTags.map((tag) => (
              <div key={tag.key} className="flex items-center gap-2 px-3 py-1 bg-[#8000ff]/10 text-[#8000ff] rounded-full text-sm">
                <span>{tag.label}</span>
                <button onClick={() => removeFilterTag(tag.key)} className="p-0.5 hover:bg-[#8000ff]/20 rounded-full"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#8000ff] animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {jobOffers.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune offre d'emploi trouvée</p>
              {activeFilterCount > 0 ? (
                <button onClick={resetFilters} className="text-[#8000ff] font-medium">Réinitialiser les filtres</button>
              ) : (
                <button onClick={() => setShowModal(true)} className="text-[#8000ff] font-medium">Ajouter votre première offre</button>
              )}
            </div>
          ) : (
            <>
            {jobOffers.slice(startIndex, startIndex + itemsPerPage).map((job) => (
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
                        
                        {/* Status Control: Select for manual, Badge for automatic */}
                        {job.statusSource === 'MANUAL' ? (
                          <div className="relative group">
                            <select
                              value={job.status}
                              onChange={(e) => handleStatusChange(job.id, e.target.value)}
                              className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-semibold border cursor-pointer outline-none focus:ring-2 focus:ring-[#8000ff]/50 transition-all ${getStatusBadge(job.status)}`}
                            >
                              <option value="DRAFT">Brouillon</option>
                              <option value="PUBLISHED">Publié</option>
                              <option value="PAUSED">En pause</option>
                              <option value="CANCELLED">Annulé</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60 pointer-events-none" />
                          </div>
                        ) : (
                          <span 
                            className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-default ${getStatusBadge(job.status)}`}
                            title="Statut géré automatiquement par le système"
                          >
                            {getStatusLabel(job.status)} (Auto)
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#8000ff]" />
                          RH
                        </span>
                        <span className="capitalize">{job.contractType.toLowerCase()}</span>
                        <span>{job.workMode}</span>
                        <span>Créée le {new Date(job.createdAt).toLocaleDateString()}</span>
                        {job._count?.applications !== undefined && (
                          <Link
                            to={`/dashboard/rh/job-offers/${job.id}/candidats`}
                            className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold hover:bg-purple-500/20 border border-purple-500/20 transition-all shadow-sm"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {job._count.applications} candidat{job._count.applications > 1 ? 's' : ''}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => setSelectedJob(job)} className="p-2 text-gray-500 hover:text-[#8000ff]"><Eye className="w-5 h-5" /></button>
                      <button onClick={() => handleEditJob(job)} className="p-2 text-gray-500 hover:text-[#8000ff]"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
            ))}
           </>
              )}
        </div>
      )}

      {totalItems > itemsPerPage && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">Affichage {startIndex + 1}-{endIndex} sur {totalItems} offres</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 disabled:opacity-50"><ChevronLeft /></button>
            {getPageNumbers().map((p, i) => (
              <button key={i} onClick={() => typeof p === 'number' && setCurrentPage(p)} className={`w-10 h-10 rounded-lg ${currentPage === p ? 'bg-[#8000ff] text-white' : ''}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 disabled:opacity-50"><ChevronRight /></button>
          </div>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)}><X /></button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedJob.description}</p>
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Compétences</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map(s => <span key={s} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">{s}</span>)}
                </div>
              </div>
              
            )}
            {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
              {selectedJob.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
              ))}
              </ul>
            </div>
            )}
          </div>
        </div>
      )}

      <JobOfferModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingJob(null); }}
        onSuccess={() => fetchJobs()}
        initialData={editingJob as any}
      />

      {/* Status Update Toast */}
      {statusToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
            statusToast.type === 'success' 
              ? 'bg-green-500 text-white border-green-600' 
              : 'bg-red-500 text-white border-red-600'
          }`}>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-semibold">{statusToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
