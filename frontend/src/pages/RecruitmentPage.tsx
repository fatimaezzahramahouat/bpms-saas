import { useState, useMemo } from 'react';
import { JobCard } from '../components/JobCard';
import { ApplicationModal } from '../components/ApplicationModal';
import { Search, X, MapPin, Briefcase } from 'lucide-react';

/**
 * Job offer type definition
 */
interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  postedDate: string;
}

/**
 * Mock job offers data
 */
const jobOffers: JobOffer[] = [
  {
    id: 1,
    title: 'Développeur Frontend React',
    company: 'Nexflow',
    location: 'Casablanca, Maroc',
    type: 'CDI',
    description: 'Rejoignez notre équipe pour développer des interfaces utilisateur modernes et performantes utilisant React, TypeScript et les dernières technologies web.',
    postedDate: 'Il y a 2 jours',
  },
  {
    id: 2,
    title: 'Designer UI/UX',
    company: 'TechCorp',
    location: 'Rabat, Maroc',
    type: 'CDI',
    description: 'Nous cherchons un designer créatif pour concevoir des expériences utilisateur exceptionnelles pour nos applications mobiles et web.',
    postedDate: 'Il y a 3 jours',
  },
  {
    id: 3,
    title: 'Développeur Backend Node.js',
    company: 'DataFlow',
    location: 'Casablanca, Maroc',
    type: 'CDI',
    description: 'Participez à la conception et au développement de nos APIs microservices utilisant Node.js, Express et PostgreSQL.',
    postedDate: 'Il y a 5 jours',
  },
  {
    id: 4,
    title: 'Stagiaire Marketing Digital',
    company: 'GrowthLab',
    location: 'Marrakech, Maroc',
    type: 'Stage',
    description: 'Une opportunité de stage pour acquérir une expérience pratique en marketing digital, SEO et gestion des réseaux sociaux.',
    postedDate: 'Il y a 1 semaine',
  },
  {
    id: 5,
    title: 'Chef de Projet IT',
    company: 'InnovTech',
    location: 'Tanger, Maroc',
    type: 'CDI',
    description: 'Gérez des projets technologiques from scratch, coordonnez les équipes de développement et assurez le respect des délais.',
    postedDate: 'Il y a 1 semaine',
  },
  {
    id: 6,
    title: 'Développeur Full Stack',
    company: 'CloudNine',
    location: 'Casablanca, Maroc',
    type: 'CDD',
    description: 'Travailler sur des projets stimulants en utilisant React pour le frontend et Node.js pour le backend.',
    postedDate: 'Il y a 2 semaines',
  },
  {
    id: 7,
    title: 'Développeur Freelance',
    company: 'TechHub',
    location: 'Remote',
    type: 'Freelance',
    description: 'Rejoignez notre pool de développeurs freelance pour des missions variées sur des projets innovants.',
    postedDate: 'Il y a 3 jours',
  },
  {
    id: 8,
   title: 'Développeur Mobile React Native',
    company: 'AppWorks',
    location: 'Casablanca, Maroc',
    type: 'CDI',
    description: 'Développez des applications mobiles performantes pour iOS et Android avec React Native.',
    postedDate: 'Il y a 1 semaine',
  },
];

/**
 * Get unique contract types from job offers
 */
const contractTypes = ['CDI', 'CDD', 'Stage', 'Freelance'];

/**
 * Get unique locations from job offers
 */
const uniqueLocations = Array.from(new Set(jobOffers.map(job => job.location.split(',')[0].trim())));

/**
 * Recruitment Page Component
 * 
 * Displays job offers in a responsive grid layout with search and filtering.
 */
export function RecruitmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contractType, setContractType] = useState('');
  const [location, setLocation] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);

  /**
   * Filter job offers based on search query, contract type, and location
   */
  const filteredJobs = useMemo(() => {
    return jobOffers.filter((job) => {
      // Search by title (case-insensitive)
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by contract type
      const matchesContractType = !contractType || job.type === contractType;
      
      // Filter by location (partial match)
      const matchesLocation = !location || job.location.toLowerCase().includes(location.toLowerCase());
      
      return matchesSearch && matchesContractType && matchesLocation;
    });
  }, [searchQuery, contractType, location]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = searchQuery || contractType || location;

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setSearchQuery('');
    setContractType('');
    setLocation('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-h1-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-gray-50 dark:from-h1-black to-white dark:to-h1-black py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Recrutement</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Rejoignez nos équipes et participez à des projets innovants
          </p>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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
                onChange={(e) => setContractType(e.target.value)}
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
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Toutes les localisations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
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
                {filteredJobs.length} offre{filteredJobs.length !== 1 ? 's' : ''} trouvée{filteredJobs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        
        {/* Responsive Grid */}
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id}>
                <JobCard job={job} onApply={setSelectedJob} />
              </div>
            ))}
          </div>
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
        jobId={selectedJob?.id || 0}
      />
    </div>
  );
}
