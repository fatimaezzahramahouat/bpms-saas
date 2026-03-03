import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Briefcase, 
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building,
  X
} from 'lucide-react';
import { useCVAnalysis } from '../../../shared/hooks/useCVAnalysis';
import { CandidateAnalysis } from '../../../shared/services/geminiService';
import { MatchingPercentage } from '../components/MatchingPercentage';

// ============ Types ============
interface CandidateInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  currentPosition?: string;
  company?: string;
}

// ============ Sub-Component: CV Link ============
interface CVLinkProps {
  file: File;
  onAnalyze: () => void;
  isAnalyzed: boolean;
  isLoading: boolean;
}

function CVLink({ file, onAnalyze, isAnalyzed, isLoading }: CVLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAnalyzed && !isLoading) {
      onAnalyze();
    }
    
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 p-3 bg-[var(--input-bg)] hover:bg-purple-500/10 rounded-lg transition-colors group w-full"
    >
      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
        <FileText className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-purple-400 transition-colors">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {isAnalyzed ? (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle className="w-3 h-3" />
              Analysé
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-500">
              <AlertCircle className="w-3 h-3" />
              Non analysé
            </span>
          )}
        </div>
      </div>
      <Download className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-purple-400 transition-colors" />
    </button>
  );
}

// ============ Sub-Component: Toast ============
interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'error';
  isVisible: boolean;
}

function Toast({ message, type, isVisible }: ToastProps) {
  if (!isVisible) return null;
  
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-purple-500';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Sparkles;
  
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 ${bgColor} text-white rounded-lg shadow-lg animate-slide-in-right`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

// ============ Main Component ============
interface CandidateProfilePageProps {
  candidateName?: string;
  candidateEmail?: string;
}

export function CandidateProfilePage({ 
  candidateName = 'Candidat', 
  candidateEmail = 'email@candidat.com' 
}: CandidateProfilePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const { analysis, loading, error, performAnalysis, reset } = useCVAnalysis();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isNewAnalysis, setIsNewAnalysis] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Mock candidate info - en production, ces données viendraient d'une API
  const candidateInfo: CandidateInfo = {
    name: candidateName,
    email: candidateEmail,
    phone: '+33 6 12 34 56 78',
    location: 'Paris, France',
    dateOfBirth: '15 Mars 1990',
    currentPosition: 'Développeur Full Stack',
    company: 'TechCorp France'
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Auto-scroll to analysis section when new analysis completes
  useEffect(() => {
    if (isNewAnalysis && analysis) {
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => setIsNewAnalysis(false), 2000);
      }, 100);
    }
  }, [analysis, isNewAnalysis]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier PDF');
      return;
    }

    setCvFile(file);
    setShowAnalysis(true);
    
    showToast('Analyse AI démarrée...', 'info');
    await performAnalysis(file);
    setIsNewAnalysis(true);
    showToast('Analyse AI terminée avec succès!', 'success');
  };

  // Handle CV download click - trigger analysis if not done
  const handleAnalyzeFromLink = async () => {
    if (!cvFile) return;
    
    if (!analysis) {
      setShowAnalysis(true);
      showToast('Analyse AI démarrée...', 'info');
      await performAnalysis(cvFile);
      setIsNewAnalysis(true);
      showToast('Analyse AI terminée avec succès!', 'success');
    }
  };

  // Handle new upload
  const handleNewUpload = () => {
    setCvFile(null);
    setShowAnalysis(false);
    setIsNewAnalysis(false);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get recommendation based on score
  const getRecommendation = (score: number): { text: string; color: string; icon: React.ReactNode } => {
    if (score >= 75) {
      return { 
        text: 'À retenir', 
        color: 'text-green-500',
        icon: <CheckCircle className="w-6 h-6 text-green-500" />
      };
    } else if (score >= 50) {
      return { 
        text: 'À évaluer', 
        color: 'text-yellow-500',
        icon: <AlertCircle className="w-6 h-6 text-yellow-500" />
      };
    } else {
      return { 
        text: 'Non recommandé', 
        color: 'text-red-500',
        icon: <X className="w-6 h-6 text-red-500" />
      };
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-6">
      {/* Toast Notification */}
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Profil Candidat
          </h1>
          <div className="flex items-center gap-4 text-[var(--text-secondary)]">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {candidateName}
            </span>
            <span>|</span>
            <span>{candidateEmail}</span>
          </div>
        </div>

        {/* ============ LAYOUT CÔTE À CÔTE: GRID 2 COLONNES ============ */}
        <div className="candidate-profile-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          
          {/* ==================== SECTION GAUCHE: INFOS CANDIDAT + CV ==================== */}
          <div className="candidate-left-section">
            {/* Carte d'identité du candidat */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Informations Personnelles</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Profil du candidat</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Nom */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Nom complet</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.name}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Email</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.email}</p>
                  </div>
                </div>

                {/* Téléphone */}
                {candidateInfo.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Téléphone</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.phone}</p>
                    </div>
                  </div>
                )}

                {/* Localisation */}
                {candidateInfo.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Localisation</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.location}</p>
                    </div>
                  </div>
                )}

                {/* Poste actuel */}
                {candidateInfo.currentPosition && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Poste actuel</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.currentPosition}</p>
                    </div>
                  </div>
                )}

                {/* Entreprise */}
                {candidateInfo.company && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Building className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Entreprise</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.company}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section CV Upload */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">CV du candidat</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {cvFile ? cvFile.name : 'Téléchargez un PDF pour lancer l\'analyse'}
                    </p>
                  </div>
                </div>
                
                <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Uploader PDF</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>

              {/* CV Link (when file is uploaded) */}
              {cvFile && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <CVLink 
                    file={cvFile} 
                    onAnalyze={handleAnalyzeFromLink} 
                    isAnalyzed={!!analysis}
                    isLoading={loading}
                  />
                </div>
              )}

              {/* Empty State - No CV yet */}
              {!cvFile && !analysis && !loading && !error && (
                <div className="p-8 bg-[var(--bg-main)] rounded-xl text-center mt-4">
                  <FileText className="w-12 h-12 text-purple-500/30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Upload un CV au format PDF pour obtenir une analyse automatique
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Uploader un CV</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ==================== SECTION DROITE: ANALYSE IA COMPLÈTE ==================== */}
          <div className="candidate-right-section" ref={analysisRef}>
            {/* Loading State */}
            {loading && (
              <div className="analysis-loading p-8 bg-[var(--card-bg)] border border-purple-500/30 rounded-2xl">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Analyse AI en cours...
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    L'IA analyse le CV et extrait les informations pertinentes
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-500 mb-1">
                      Erreur d'analyse
                    </h3>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                  <button
                    onClick={cvFile ? () => performAnalysis(cvFile) : handleNewUpload}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}

            {/* ============ UNE SEULE CARD COMPLÈTE AVEC TOUTES LES INFUSIONS ============ */}
            {analysis && !loading && !error && showAnalysis && (
              <div 
                className={`bg-[var(--card-bg)] border border-purple-500/20 rounded-2xl p-6 shadow-md transition-all duration-500 ${
                  isNewAnalysis ? 'animate-fade-in ring-2 ring-purple-500/30' : ''
                }`}
              >
                {/* Header Analyse IA */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Analyse IA Complète</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Gemini AI</p>
                  </div>
                </div>

                {/* Score de compatibilité */}
                <div className="mb-6 p-4 bg-[var(--bg-main)] rounded-xl">
                  <MatchingPercentage 
                    percentage={analysis.score} 
                    showCircular={true} 
                    size="lg" 
                  />
                </div>

                {/* Recommandation */}
                {(() => {
                  const rec = getRecommendation(analysis.score);
                  return (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                      analysis.score >= 75 ? 'bg-green-500/10 border border-green-500/30' :
                      analysis.score >= 50 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                      'bg-red-500/10 border border-red-500/30'
                    }`}>
                      {rec.icon}
                      <span className={`font-semibold ${rec.color}`}>
                        {rec.text}
                      </span>
                    </div>
                  );
                })()}

                {/* Compétences */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-500" />
                    Compétences techniques
                  </h3>
                  <div className="space-y-3">
                    {analysis.competences.map((comp, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--text-secondary)]">{comp.nom}</span>
                          <span className={`font-medium ${
                            comp.niveau >= 70 ? 'text-green-500' :
                            comp.niveau >= 40 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {comp.niveau}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              comp.niveau >= 70 ? 'bg-green-500' :
                              comp.niveau >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            } rounded-full`}
                            style={{ width: `${comp.niveau}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Points forts */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Points forts
                  </h3>
                  <ul className="space-y-2">
                    {analysis.pointsForts.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Points faibles */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    Points à améliorer
                  </h3>
                  <ul className="space-y-2">
                    {analysis.pointsFaibles.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-yellow-400">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expérience */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    Expérience
                  </h3>
                  <div className="p-4 bg-[var(--bg-main)] rounded-lg">
                    <p className="text-sm text-[var(--text-secondary)]">{analysis.experience}</p>
                  </div>
                </div>

                {/* Formation */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    Formation
                  </h3>
                  <ul className="space-y-2">
                    {analysis.formation.map((edu, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Empty State - Waiting for CV */}
            {!cvFile && !analysis && !loading && (
              <div className="p-12 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl text-center">
                <Sparkles className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Analyse IA en attente
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  Uploadez le CV du candidat dans la section de gauche pour lancer l'analyse automatique
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Analyse générée par Gemini AI</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ RESPONSIVE: Mobile (< 768px) ============ */}
        <style>{`
          @media (max-width: 768px) {
            .candidate-profile-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default CandidateProfilePage;
