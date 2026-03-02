import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, Briefcase, MapPin, Clock, Loader2, Download, FileSpreadsheet, FileText, Share2, Printer } from 'lucide-react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast, toastSuccess, toastError } from '../../../shared/components/Toast';
import { CandidateCard, Candidate, CandidateStatus } from '../components/CandidateCard';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
import { Pagination, PaginationSkeleton } from '../components/Pagination';
import { SearchBar, CandidateFilters, ActiveFilters } from '../components';
import { useCandidateFilters } from '../hooks/useCandidateFilters';
import { exportCandidatesToCSV, exportAnalysisToPDF, copyToClipboard, generateShareableLink } from '../utils/exportUtils';

// ========== INTERFACES (at top) ==========
interface JobOffer {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  requiredSkills?: string[];
  requiredExperience?: string;
  requiredEducation?: string;
}

// ========== MOCK DATA (at top, outside component) ==========
const mockJobOffer: JobOffer = {
  id: '1',
  title: 'Développeur Full Stack',
  department: 'Développement',
  type: 'CDI',
  location: 'Casablanca',
  requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', '5+ ans expérience'],
  requiredExperience: '5+ ans',
  requiredEducation: 'Bac+5 en Informatique',
};

const mockCandidates: Candidate[] = [
  {
    id: '1',
    firstName: 'Mohamed',
    lastName: 'El Amrani',
    email: 'mohamed.elamrani@email.com',
    phone: '+212 6 12 34 56 78',
    appliedDate: '2026-02-15',
    status: 'Nouveau',
    jobOfferId: '1',
    formData: {
      skills: ['React', 'TypeScript', 'Node.js', 'JavaScript', 'PostgreSQL'],
      experienceLevel: '3 ans',
      education: 'Master en Informatique',
      availability: 'Immédiate',
      salaryExpectations: '45 000€ - 55 000€',
      coverLetter: 'Passionné par le développement web...',
      cvFileName: 'cv_mohamed_el_amrani.pdf',
    },
    matchPercentage: 72,
  },
  {
    id: '2',
    firstName: 'Fatima',
    lastName: 'Zahra',
    email: 'fatima.zahra@email.com',
    phone: '+212 6 23 45 67 89',
    appliedDate: '2026-02-10',
    status: 'En cours',
    jobOfferId: '1',
    formData: {
      skills: ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
      experienceLevel: '6 ans',
      education: 'Diplôme d\'Ingénieur en Informatique',
      availability: '1 mois',
      salaryExpectations: '55 000€ - 65 000€',
      coverLetter: 'Experte en architectures cloud...',
      cvFileName: 'cv_fatima_zahra.pdf',
    },
    matchPercentage: 88,
  },
  {
    id: '3',
    firstName: 'Youssef',
    lastName: 'Benali',
    email: 'youssef.benali@email.com',
    phone: '+212 6 34 56 78 90',
    appliedDate: '2026-02-08',
    status: 'Nouveau',
    jobOfferId: '1',
    formData: {
      skills: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
      experienceLevel: '1 an',
      education: 'Licence en Développement Web',
      availability: 'Immédiate',
      salaryExpectations: '30 000€ - 40 000€',
      coverLetter: 'Junior motivé...',
      cvFileName: 'cv_youssef_benali.pdf',
    },
    matchPercentage: 35,
  },
  {
    id: '4',
    firstName: 'Amina',
    lastName: 'Khatib',
    email: 'amina.khatib@email.com',
    phone: '+212 6 45 67 89 01',
    appliedDate: '2026-02-05',
    status: 'Archivé',
    jobOfferId: '1',
    formData: {
      skills: ['React', 'Vue.js', 'TypeScript', 'Figma'],
      experienceLevel: '4 ans',
      education: 'Master en Design UI/UX',
      availability: '2 mois',
      salaryExpectations: '48 000€ - 58 000€',
      coverLetter: 'Designer et développeuse front-end...',
      cvFileName: 'cv_amina_khatib.pdf',
    },
    matchPercentage: 65,
  },
  {
    id: '5',
    firstName: 'Ali',
    lastName: 'Mansouri',
    email: 'ali.mansouri@email.com',
    phone: '+212 6 56 78 90 12',
    appliedDate: '2026-02-01',
    status: 'Rejeté',
    jobOfferId: '1',
    formData: {
      skills: ['Python', 'Django', 'SQL'],
      experienceLevel: '2 ans',
      education: 'Bac+3 en Informatique',
      availability: '3 mois',
      salaryExpectations: '35 000€ - 45 000€',
      coverLetter: 'Passionné par Python...',
      cvFileName: 'cv_ali_mansouri.pdf',
    },
    matchPercentage: 28,
  },
  {
    id: '6',
    firstName: 'Sara',
    lastName: 'Benharkat',
    email: 'sara.benharkat@email.com',
    phone: '+212 6 67 89 01 23',
    appliedDate: '2026-01-28',
    status: 'En cours',
    jobOfferId: '1',
    formData: {
      skills: ['React', 'Next.js', 'GraphQL', 'Tailwind CSS'],
      experienceLevel: '5 ans',
      education: 'Diplôme d\'Ingénieur',
      availability: 'Immédiate',
      salaryExpectations: '50 000€ - 60 000€',
      coverLetter: 'Développeuse passionnée...',
      cvFileName: 'cv_sara_benharkat.pdf',
    },
    matchPercentage: 78,
  },
  {
    id: '7',
    firstName: 'Omar',
    lastName: 'Tazi',
    email: 'omar.tazi@email.com',
    phone: '+212 6 78 90 12 34',
    appliedDate: '2026-01-25',
    status: 'Nouveau',
    jobOfferId: '1',
    formData: {
      skills: ['Java', 'Spring Boot', 'Microservices'],
      experienceLevel: '7 ans',
      education: 'Master en Ingénierie Logicielle',
      availability: '1 mois',
      salaryExpectations: '60 000€ - 70 000€',
      coverLetter: 'Expert Java...',
      cvFileName: 'cv_omar_tazi.pdf',
    },
    matchPercentage: 45,
  },
  {
    id: '8',
    firstName: 'Laila',
    lastName: 'Chraibi',
    email: 'laila.chraibi@email.com',
    phone: '+212 6 89 01 23 45',
    appliedDate: '2026-01-20',
    status: 'En cours',
    jobOfferId: '1',
    formData: {
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
      experienceLevel: '4 ans',
      education: 'Engineer Degree',
      availability: '2 mois',
      salaryExpectations: '52 000€ - 62 000€',
      coverLetter: 'Full-stack developer...',
      cvFileName: 'cv_laila_chraibi.pdf',
    },
    matchPercentage: 82,
  },
];

// ========== SKELETON COMPONENT (outside main component) ==========
function CandidateSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--input-bg)]"></div>
          <div>
            <div className="h-5 w-32 bg-[var(--input-bg)] rounded mb-2"></div>
            <div className="h-4 w-20 bg-[var(--input-bg)] rounded"></div>
          </div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-48 bg-[var(--input-bg)] rounded"></div>
        <div className="h-4 w-36 bg-[var(--input-bg)] rounded"></div>
        <div className="h-4 w-40 bg-[var(--input-bg)] rounded"></div>
      </div>
      <div className="h-10 bg-[var(--input-bg)] rounded-lg mb-4"></div>
      <div className="flex gap-2 pt-3 border-t border-[var(--border-color)]">
        <div className="flex-1 h-10 bg-[var(--input-bg)] rounded-lg"></div>
        <div className="h-10 w-10 bg-[var(--input-bg)] rounded-lg"></div>
        <div className="h-10 w-10 bg-[var(--input-bg)] rounded-lg"></div>
      </div>
    </div>
  );
}

// ========== EMPTY STATE COMPONENT (outside main component) ==========
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
        <Users className="w-10 h-10 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        Aucune candidature
      </h3>
      <p className="text-[var(--text-secondary)] text-center max-w-md">
        Cette offre d'emploi n'a pas encore reçu de candidatures. Revenez plus tard.
      </p>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export function JobOfferCandidatsPage() {
  // ========== PHASE 1: ALL HOOKS AT THE VERY TOP (NO EXCEPTIONS) ==========
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToast } = useToast();

  // State hooks
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Constants (after hooks)
  const itemsPerPage = 4;
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);

  // Filter hook (depends on candidates, which is a hook)
  const { filters, updateFilter, resetFilters, filteredCandidates } = useCandidateFilters(candidates);

  // Derived state (calculated after hooks, not hooks themselves)
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);
  const isRH = user?.role === 'RH' || user?.rh;

  // ========== PHASE 2: HELPER FUNCTIONS (NOT HOOKS) ==========
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (id === '404') {
        setError('offre-404');
        return;
      }
      setJobOffer(mockJobOffer);
      setCandidates(mockCandidates);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const handleRetry = useCallback(() => {
    setError(null);
    loadData();
  }, [loadData]);

  const handleViewAnalysis = useCallback((candidate: Candidate) => {
    console.log('View analysis for:', candidate);
  }, []);

  const handleSave = useCallback((candidate: Candidate) => {
    console.log('Save candidate:', candidate);
    addToast(toastSuccess(
      'Candidature sauvegardée',
      `La candidature de ${candidate.firstName} ${candidate.lastName} a été sauvegardée.`
    ));
  }, [addToast]);

  const handleDelete = useCallback((candidate: Candidate) => {
    console.log('Delete candidate:', candidate);
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    addToast(toastSuccess(
      'Candidature supprimée',
      `La candidature de ${candidate.firstName} ${candidate.lastName} a été supprimée.`
    ));
  }, [addToast]);

  const handleExportCSV = useCallback(async () => {
    if (!jobOffer) return;
    setIsExporting(true);
    try {
      exportCandidatesToCSV(filteredCandidates, jobOffer.title);
      addToast(toastSuccess(
        'Export CSV réussie',
        `${filteredCandidates.length} candidat(s) exporté(s) avec succès.`
      ));
    } catch {
      addToast(toastError('Export échoué', 'Une erreur est survenue lors de l\'export CSV.'));
    } finally {
      setIsExporting(false);
    }
  }, [jobOffer, filteredCandidates, addToast]);

  const handleExportPDF = useCallback(async (candidate: Candidate) => {
    if (!jobOffer) return;
    try {
      exportAnalysisToPDF(candidate, {
        title: jobOffer.title,
        requiredSkills: jobOffer.requiredSkills || [],
        requiredExperience: jobOffer.requiredExperience || '',
        requiredEducation: jobOffer.requiredEducation || '',
      });
      addToast(toastSuccess(
        'Export PDF réussie',
        `Analyse de ${candidate.firstName} ${candidate.lastName} exportée.`
      ));
    } catch {
      addToast(toastError('Export échoué', 'Une erreur est survenue lors de l\'export PDF.'));
    }
  }, [jobOffer, addToast]);

  const handleShareCandidate = useCallback(async (candidate: Candidate) => {
    const link = generateShareableLink(candidate.id);
    const success = await copyToClipboard(link);
    addToast(success 
      ? toastSuccess('Lien copié', 'Le lien de partage a été copié dans le presse-papiers.')
      : toastError('Erreur', 'Impossible de copier le lien.')
    );
  }, [addToast]);

  const handlePrint = useCallback(() => { window.print(); }, []);
  const handleBack = useCallback(() => { navigate('/dashboard/rh/job-offers'); }, [navigate]);

  const jobRequirements = jobOffer ? {
    title: jobOffer.title,
    requiredSkills: jobOffer.requiredSkills || [],
    requiredExperience: jobOffer.requiredExperience || '',
    requiredEducation: jobOffer.requiredEducation || '',
  } : null;

  // ========== PHASE 3: EFFECTS (AFTER ALL HOOKS AND FUNCTIONS) ==========
  useEffect(() => {
    if (currentPage !== pageFromUrl) {
      setSearchParams({ page: currentPage.toString() }, { replace: true });
    }
  }, [currentPage, pageFromUrl, setSearchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== PHASE 4: CONDITIONAL EARLY RETURNS (AFTER ALL HOOKS) ==========
  console.log('🎯 Job Offer ID:', id);

  if (!id) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-500 text-lg">Erreur: ID de l'offre non trouvé</p>
          <button onClick={handleBack} className="mt-4 text-purple-600 hover:underline">
            ← Retour aux offres
          </button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (!isRH) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Accès refusé</h1>
        <p className="text-[var(--text-secondary)] mb-4">Vous n'avez pas l'autorisation d'accéder à cette page.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  // ========== PHASE 5: MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button onClick={handleBack} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-purple-400 mb-6 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Retour aux offres d'emploi</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Candidatures</h1>
              {!isLoading && jobOffer && (
                <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                  {candidates.length} candidat{candidates.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {!isLoading && candidates.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={handleExportCSV} disabled={isExporting} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm font-medium rounded-lg">
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  CSV
                </button>
                <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium rounded-lg">
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-red-400 font-medium">{error === 'offre-404' ? 'Offre d\'emploi non trouvée' : 'Une erreur est survenue'}</p>
                <button onClick={handleRetry} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Job Info */}
          {jobOffer && (
            <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)]">
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-purple-500" /><span className="font-medium text-[var(--text-primary)]">{jobOffer.title}</span></div>
              <span className="text-[var(--border-color)]">|</span>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /><span>{jobOffer.department}</span></div>
              <span className="text-[var(--border-color)]">|</span>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-500" /><span>{jobOffer.type}</span></div>
              <span className="text-[var(--border-color)]">|</span>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-500" /><span>{jobOffer.location}</span></div>
            </div>
          )}
        </div>

        {/* Filters */}
        {!isLoading && jobOffer && candidates.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <SearchBar value={filters.search} onChange={(value) => updateFilter('search', value)} placeholder="Rechercher par nom, email ou compétences..." />
              <CandidateFilters filters={filters} updateFilter={updateFilter} resetFilters={resetFilters} statusCounts={{
                'Nouveau': candidates.filter(c => c.status === 'Nouveau').length,
                'En cours': candidates.filter(c => c.status === 'En cours').length,
                'Archivé': candidates.filter(c => c.status === 'Archivé').length,
                'Rejeté': candidates.filter(c => c.status === 'Rejeté').length,
              }} activeFilterCount={(filters.search ? 1 : 0) + filters.status.length + (filters.minScore > 0 || filters.maxScore < 100 ? 1 : 0) + (filters.dateRange.start || filters.dateRange.end ? 1 : 0) + filters.skills.length} />
            </div>
            <ActiveFilters filters={filters} updateFilter={updateFilter} resetFilters={resetFilters} />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <CandidateSkeleton key={i} />)}
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedCandidates.map((candidate) => (
                <div key={candidate.id} className="space-y-4">
                  <CandidateCard candidate={candidate} onViewAnalysis={handleViewAnalysis} onSave={handleSave} onDelete={handleDelete} jobRequirements={jobRequirements?.requiredSkills || []} />
                  {jobRequirements && candidate.formData && <AIAnalysisPanel candidate={{ firstName: candidate.firstName, lastName: candidate.lastName, email: candidate.email, skills: candidate.formData.skills, experienceLevel: candidate.formData.experienceLevel, education: candidate.formData.education, coverLetter: candidate.formData.coverLetter }} jobRequirements={jobRequirements} />}
                </div>
              ))}
            </div>
            <div id="candidates-list" className="mt-6">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={candidates.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} isLoading={isLoading} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JobOfferCandidatsPage;