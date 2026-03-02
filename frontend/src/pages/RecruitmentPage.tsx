import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { JobCard } from '../components/JobCard';
import { ApplicationModal } from '../components/ApplicationModal';
import { JobDetailsModal } from '../components/JobDetailsModal';
import { Footer } from '@shared/components';
import { Search, X, MapPin, Briefcase, Home, Loader2, AlertCircle } from 'lucide-react';
import { jobOfferService, JobOffer } from '../shared/services/jobOffer.service';

/**
 * Recruitment Page Component
 * 
 * Displays job offers in a responsive grid layout with search and filtering from backend.
 */
export function RecruitmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contractType, setContractType] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobOffer | null>(null);
  
  // API States
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const jobsPerPage = 6;
  const contractTypes = ['CDI', 'CDD', 'STAGE', 'FREELANCE', 'ALTERNANCE'];
  const workModes = ['REMOTE', 'ONSITE', 'HYBRID'];

  /**
   * Filter jobs in frontend by WorkMode
   */
  const filteredJobs = useMemo(() => {
    if (!workMode) return jobs;
    return jobs.filter(job => job.workMode === workMode);
  }, [jobs, workMode]);

  /**
   * Fetch jobs from backend
   */
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await jobOfferService.getPublicOffers({
        page: currentPage,
        limit: jobsPerPage,
        search: searchQuery,
        contractType: contractType || undefined,
        city: location || undefined
      });
      setJobs(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalCount(response.meta.total);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Impossible de charger les offres d\'emploi. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, contractType, location]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = searchQuery || contractType || location || workMode;

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setSearchQuery('');
    setContractType('');
    setLocation('');
    setWorkMode('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-h1-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* Compact Custom Header */}
      <div className="bg-white dark:bg-h1-black border-b border-gray-200 dark:border-white/10 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link to="/" className="shrink-0">
            <img 
              src="/assets/nexflow1.png" 
              alt="Nexflow Logo" 
              className="h-10 w-auto dark:hidden" 
            />
            <img 
              src="/assets/nexflow.png" 
              alt="Nexflow Logo" 
              className="h-10 w-auto hidden dark:block" 
            />
          </Link>
          
          {/* Center: French Text */}
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white text-center hidden md:block">
            Trouvez votre prochaine opportunité professionnelle
          </h1>
          
          {/* Right: Home Button */}
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 bg-h1-blue hover:bg-h1-blue/90 text-white font-medium rounded-lg transition-colors shrink-0"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>

      {/* Job Listings Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Nos offres d'emploi</h2>
        
        {/* Search and Filters Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre ou entreprise..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Contract Type Filter */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <select
                value={contractType}
                onChange={(e) => {
                  setContractType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 bg-gray-50 dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Tous les contrats</option>
                {contractTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ville (ex: Casablanca)"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 bg-gray-50 dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-all"
              />
            </div>

            {/* WorkMode Filter */}
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-gray-400" />
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Tous les modes</option>
                {workModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2.5 text-h1-blue hover:bg-h1-blue/10 border border-h1-blue rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            )}

            {/* Results Count Badge */}
            <div className="ml-auto">
              <span className="px-4 py-2 bg-h1-blue/10 text-h1-blue font-semibold rounded-lg">
                {isLoading ? '...' : `${totalCount} offre${totalCount !== 1 ? 's' : ''} trouvée${totalCount !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-h1-blue animate-spin" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement des offres...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-red-900 dark:text-red-400">Erreur</h3>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
              onClick={() => fetchJobs()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div key={job.id}>
                  <JobCard job={job} onApply={setSelectedJob} onReadMore={setSelectedJobForDetails} />
                </div>
              ))}
            </div>

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="mt-12">
                <div className="flex flex-col items-center gap-4">
                  {/* Page Info */}
                  <div className="text-h1-slate dark:text-h1-slate text-sm font-medium">
                    Page {currentPage} sur {totalPages}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-h1-black border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white hover:bg-h1-blue hover:text-white hover:border-h1-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? 'bg-h1-blue text-white'
                            : 'bg-white dark:bg-h1-black border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-h1-blue hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-h1-black border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white hover:bg-h1-blue hover:text-white hover:border-h1-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* No Results Message */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-h1-blue text-white font-semibold rounded-lg hover:bg-h1-blue/90 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Application Modal */}
      <ApplicationModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        jobTitle={selectedJob?.title || ''}
        jobId={selectedJob?.id ? String(selectedJob.id) : ''}
      />

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJobForDetails as JobOffer}
        isOpen={!!selectedJobForDetails}
        onClose={() => setSelectedJobForDetails(null)}
      />

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
