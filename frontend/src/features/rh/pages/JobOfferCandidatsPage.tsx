import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, Briefcase, MapPin, Clock, Loader2, Download, FileSpreadsheet, FileText, Share2, Printer } from 'lucide-react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast, toastSuccess, toastError } from '../../../shared/components/Toast';
import { CandidateCard, Candidate, CandidateStatus } from '../components/CandidateCard';
import { LightAnalysisPreview } from '../components/LightAnalysisPreview';
import { Pagination, PaginationSkeleton } from '../components/Pagination';
import { SearchBar, CandidateFilters, ActiveFilters } from '../components';
import { useCandidateFilters } from '../hooks/useCandidateFilters';
import { exportCandidatesToCSV, exportAnalysisToPDF, copyToClipboard, generateShareableLink } from '../utils/exportUtils';
import { jobOfferService } from '../../../services/jobOffer.service';

// ========== INTERFACES (at top) ==========
interface JobOffer {
  id: string;
  title: string;
  department?: string;
  type?: string;
  contractType: string;
  workMode: string;
  location?: string;
  requiredSkills?: string[];
  requiredExperience?: string;
  requiredEducation?: string;
}



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
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [offerRes, candidatesRes] = await Promise.all([
        jobOfferService.getOfferById(id),
        jobOfferService.getJobCandidates(id)
      ]);
      
      if (!offerRes.data) {
        setError('offre-404');
        return;
      }

      setJobOffer(offerRes.data as any);

      // Map backend candidates to frontend Candidate type
      const mappedCandidates: Candidate[] = candidatesRes.data.map((c: any) => {
        const app = c.applications?.[0];
        const fullNameParts = c.fullName.split(' ');
        const firstName = fullNameParts[0] || '';
        const lastName = fullNameParts.slice(1).join(' ') || '';

        return {
          id: c.id,
          firstName,
          lastName,
          email: c.email,
          phone: c.phone || 'Non renseigné',
          appliedDate: app?.createdAt || c.createdAt,
          status: (app?.status === 'APPLIED' ? 'Nouveau' : 
                   app?.status === 'INTERVIEW' ? 'En cours' : 
                   app?.status === 'REJECTED' ? 'Rejeté' : 'Nouveau') as any,
          jobOfferId: id,
          formData: {
            // Try to get skills from various possible locations in the AI analysis result
            skills: app?.aiAnalyses?.[0]?.result?.matchedRequirements || 
                   app?.aiAnalyses?.[0]?.result?.exigencesCorrespondantes ||
                   app?.aiAnalyses?.[0]?.matchedSkills ||
                   [],
            experienceLevel: app?.aiAnalyses?.[0]?.result?.experience || 
                            app?.aiAnalyses?.[0]?.result?.categoryScores?.experience ||
                            app?.aiAnalyses?.[0]?.experienceScore ||
                            'Non spécifié',
            education: app?.aiAnalyses?.[0]?.result?.education ||
                      app?.aiAnalyses?.[0]?.educationScore ||
                      'Non spécifié',
            availability: 'Non spécifié',
            cvFileName: app?.documents?.[0]?.fileName || 'cv.pdf',
          },
          // Get overall score from result or confidence field
          matchPercentage: app?.aiAnalyses?.[0]?.result?.overallScore || 
                          app?.aiAnalyses?.[0]?.result?.scoreGlobal ||
                          (app?.aiAnalyses?.[0]?.confidence ? Math.round(app.aiAnalyses[0].confidence * 100) : 0),
        };
      });

      setCandidates(mappedCandidates);
    } catch (err: any) {
      console.error('Error loading candidates data:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const handleRetry = useCallback(() => {
    setError(null);
    loadData();
  }, [loadData]);

  const handleViewAnalysis = useCallback((candidate: Candidate) => {
    navigate(`/dashboard/rh/candidates/${candidate.id}`);
  }, [navigate]);

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
                  <CandidateCard 
                    candidate={candidate} 
                    onViewAnalysis={handleViewAnalysis} 
                    onSave={handleSave} 
                    onDelete={handleDelete} 
                    jobRequirements={jobRequirements?.requiredSkills || []} 
                  />
                  {jobRequirements && candidate.formData && (
                    <LightAnalysisPreview 
                      candidateId={candidate.id}
                      jobOfferId={jobOffer?.id || ''}
                      analysis={{
                        overallScore: candidate.matchPercentage || 0,
                        strengths: candidate.formData.skills?.slice(0, 3).map(s => `Compétence en ${s}`) || [],
                        skillsMatch: {
                          matched: candidate.formData.skills || [],
                          missing: [],
                          percentage: candidate.matchPercentage || 0
                        }
                      }}
                    />
                  )}
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