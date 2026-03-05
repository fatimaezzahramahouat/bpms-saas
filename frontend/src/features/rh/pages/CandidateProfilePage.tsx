// /home/manal/projet_final_BPMS/frontend/src/features/rh/pages/CandidateProfilePage.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Loader2, AlertCircle, CheckCircle, Sparkles, 
  TrendingUp, Award, BookOpen, Briefcase, Download, Mail, Phone, 
  MapPin, User, Building, X, ArrowLeft
} from 'lucide-react';
import { MatchingPercentage } from '../components/MatchingPercentage';

// ============ Types ============
interface CandidateApiResponse {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  currentPosition?: string;
  company?: string;
  cvUrl?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  jobOfferId?: string;
  jobOffer?: {
    id?: string;
    title?: string;
    requiredSkills?: string[];
    experienceRequired?: string;
    educationRequired?: string;
    level?: string;
    [key: string]: unknown;
  };
  cvData?: {
    skills?: string[];
    experience?: string;
    education?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CandidateInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  currentPosition?: string;
  company?: string;
}

interface AnalysisState {
  overallScore: number;
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    technicalFit: number;
  };
  matchedRequirements: string[];
  missingRequirements: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation?: string;
  priority?: string;
  interviewQuestions?: string[];
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
    if (!isAnalyzed && !isLoading) onAnalyze();
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
    <button onClick={handleClick} className="flex items-center gap-3 p-3 bg-[var(--input-bg)] hover:bg-purple-500/10 rounded-lg transition-colors group w-full">
      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
        <FileText className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-purple-400 transition-colors">{file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          {isAnalyzed ? (
            <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="w-3 h-3" /> Analysé</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-500"><AlertCircle className="w-3 h-3" /> Non analysé</span>
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
export function CandidateProfilePage() {
  const { id: candidateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  
  // ✅ States للبيانات والتحليل
  const [candidateData, setCandidateData] = useState<CandidateApiResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isNewAnalysis, setIsNewAnalysis] = useState(false);
  
  // ✅ State للتحليل من الـ Backend API
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; visible: boolean }>({
    message: '', type: 'info', visible: false,
  });

  // ✅ جلب بيانات المرشح من الـ Backend
  const fetchCandidateData = useCallback(async () => {
    if (!candidateId) { 
      setDataLoading(false); 
      return; 
    }
    
    try {
      setDataLoading(true);
      console.log('🔍 Fetching candidate:', candidateId);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No token found');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/candidates/${candidateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Candidate API status:', response.status);
      
      if (response.status === 401) {
        console.error('❌ Token invalid');
        navigate('/login');
        return;
      }
      
      if (response.ok) {
        const data: CandidateApiResponse = await response.json();
        console.log('✅ Candidate data received:', data);
        
        setCandidateData({
          id: data.id ?? candidateId,
          fullName: data.fullName ?? data.name ?? 'Candidat',
          name: data.name ?? data.fullName ?? 'Candidat',
          email: data.email ?? 'email@candidat.com',
          phone: data.phone ?? undefined,
          location: data.location ?? undefined,
          dateOfBirth: data.dateOfBirth ?? undefined,
          currentPosition: data.currentPosition ?? undefined,
          company: data.company ?? undefined,
          cvUrl: data.cvUrl ?? undefined,
          skills: data.skills ?? data.cvData?.skills ?? [],
          experience: data.experience ?? data.cvData?.experience ?? '',
          education: data.education ?? data.cvData?.education ?? '',
          jobOfferId: data.jobOfferId,
          jobOffer: data.jobOffer ?? undefined,
          cvData: data.cvData ?? undefined
        });
      } else {
        console.error('❌ Failed to fetch candidate');
        setCandidateData(null);
      }
    } catch (err) {
      console.error('❌ Error fetching candidate:', err);
      setCandidateData(null);
    } finally {
      setDataLoading(false);
    }
  }, [candidateId, navigate]);

  // ✅ التحقق من وجود تحليل محفوظ عند تحميل الصفحة
  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!candidateData?.id || !candidateData?.jobOfferId) return;
      
      try {
        console.log('🔍 Checking for existing analysis...');
        
        const token = localStorage.getItem('token');
        
        // البحث عن تحليل محفوظ عبر الـ application
        const response = await fetch(
          `http://localhost:5000/api/analyze-candidate/${candidateData.id}/${candidateData.jobOfferId}`,
          {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data && result.cached) {
            console.log('✅ Found cached analysis!');
            
            const backendData = result.data.analysis;
            
            const formattedAnalysis: AnalysisState = {
              overallScore: backendData.overallScore || 0,
              categoryScores: {
                skills: backendData.categoryScores?.skills || 0,
                experience: backendData.categoryScores?.experience || 0,
                education: backendData.categoryScores?.education || 0,
                technicalFit: backendData.categoryScores?.technicalFit || 0,
              },
              matchedRequirements: backendData.matchedRequirements || [],
              missingRequirements: backendData.missingRequirements || [],
              strengths: backendData.strengths || [],
              weaknesses: backendData.weaknesses || [],
              recommendation: backendData.recommendation,
              priority: backendData.priority,
              interviewQuestions: backendData.interviewQuestions || []
            };
            
            setAnalysis(formattedAnalysis);
            setShowAnalysis(true);
          } else {
            console.log('ℹ️ No cached analysis found');
          }
        }
      } catch (err) {
        console.log('No cached analysis - will create on demand');
      }
    };
    
    if (candidateData) {
      checkExistingAnalysis();
    }
  }, [candidateData]);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);

  // ✅ معلومات المرشح للعرض
  const candidateInfo: CandidateInfo = {
    name: candidateData?.fullName || candidateData?.name || 'Candidat',
    email: candidateData?.email || 'email@candidat.com',
    phone: candidateData?.phone ? String(candidateData.phone) : undefined,
    location: candidateData?.location ? String(candidateData.location) : undefined,
    dateOfBirth: candidateData?.dateOfBirth ? String(candidateData.dateOfBirth) : undefined,
    currentPosition: candidateData?.currentPosition ? String(candidateData.currentPosition) : undefined,
    company: candidateData?.company ? String(candidateData.company) : undefined
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // ✅ دالة تشغيل التحليل من الـ Backend API
  const runAnalysis = async () => {
    if (!candidateId || !candidateData) {
      setAnalysisError('Données du candidat manquantes');
      return;
    }
    
    setAnalysisLoading(true);
    setAnalysisError(null);
    setShowAnalysis(true);

    try {
      console.log('🚀 Calling analysis API for candidate:', candidateId);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/analyze-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          candidateId: candidateId,
          jobOfferId: candidateData.jobOfferId || '',
          cvData: {
            name: candidateData.fullName || candidateData.name,
            skills: candidateData.skills || [],
            experience: candidateData.experience || '',
            education: candidateData.education || ''
          },
          jobOfferData: {
            title: candidateData.jobOffer?.title || '',
            requiredSkills: candidateData.jobOffer?.requiredSkills || [],
            experienceRequired: candidateData.jobOffer?.experienceRequired || candidateData.jobOffer?.level || '',
            educationRequired: candidateData.jobOffer?.educationRequired || ''
          }
        })
      });

      console.log('📡 Analysis API status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Analysis API response:', result);
      
      if (result.success && result.data) {
        // ✅ استخراج البيانات الحقيقية من الـ Backend
        const backendData = result.data.analysis || result.data;
        
        const formattedAnalysis: AnalysisState = {
          overallScore: backendData.overallScore || 0,
          categoryScores: {
            skills: backendData.categoryScores?.skills || 0,
            experience: backendData.categoryScores?.experience || 0,
            education: backendData.categoryScores?.education || 0,
            technicalFit: backendData.categoryScores?.technicalFit || 0,
          },
          matchedRequirements: backendData.matchedRequirements || [],
          missingRequirements: backendData.missingRequirements || [],
          strengths: backendData.strengths || [],
          weaknesses: backendData.weaknesses || [],
          recommendation: backendData.recommendation,
          priority: backendData.priority,
          interviewQuestions: backendData.interviewQuestions || []
        };

        console.log('📊 REAL analysis data:', formattedAnalysis);
        setAnalysis(formattedAnalysis);
        setIsNewAnalysis(true);
        showToast('Analyse terminée avec succès!', 'success');
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('❌ Analysis error:', err);
      setAnalysisError(`Erreur: ${(err as Error).message}`);
      showToast('Erreur lors de l\'analyse', 'error');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Veuillez sélectionner un fichier PDF'); return; }
    setCvFile(file);
    setShowAnalysis(true);
    showToast('Analyse AI démarrée...', 'info');
    await runAnalysis();
  };

  const handleAnalyzeFromLink = async () => {
    if (!cvFile) return;
    if (!analysis) {
      await runAnalysis();
    }
  };

  const handleNewUpload = () => {
    setCvFile(null);
    setShowAnalysis(false);
    setIsNewAnalysis(false);
    setAnalysis(null);
    setAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeExistingCV = async () => {
    await runAnalysis();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBarColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRecommendation = (score: number): { text: string; color: string; icon: React.ReactNode } => {
    if (score >= 75) return { text: 'À retenir', color: 'text-green-500', icon: <CheckCircle className="w-6 h-6 text-green-500" /> };
    if (score >= 50) return { text: 'À évaluer', color: 'text-yellow-500', icon: <AlertCircle className="w-6 h-6 text-yellow-500" /> };
    return { text: 'Non recommandé', color: 'text-red-500', icon: <X className="w-6 h-6 text-red-500" /> };
  };

  if (dataLoading && !candidateData) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-[var(--text-secondary)]">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!candidateId && !candidateData) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-[var(--text-primary)] font-medium">Candidat non trouvé</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">← Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-6">
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-purple-400 transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Profil: {candidateInfo.name}</h1>
              <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                <span className="flex items-center gap-2"><User className="w-4 h-4" />{candidateInfo.email}</span>
                {candidateId && <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded">ID: {candidateId}</span>}
              </div>
            </div>
            {!analysis && !analysisLoading && (
              <button 
                onClick={runAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Lancer l'analyse AI
              </button>
            )}
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="candidate-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* SECTION GAUCHE */}
          <div className="candidate-left-section">
            {/* Carte d'identité */}
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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><User className="w-4 h-4 text-purple-500" /></div>
                  <div><p className="text-xs text-[var(--text-secondary)]">Nom complet</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.name}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-500" /></div>
                  <div><p className="text-xs text-[var(--text-secondary)]">Email</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.email}</p></div>
                </div>
                {candidateInfo.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center"><Phone className="w-4 h-4 text-green-500" /></div>
                    <div><p className="text-xs text-[var(--text-secondary)]">Téléphone</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.phone}</p></div>
                  </div>
                )}
                {candidateInfo.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center"><MapPin className="w-4 h-4 text-orange-500" /></div>
                    <div><p className="text-xs text-[var(--text-secondary)]">Localisation</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.location}</p></div>
                  </div>
                )}
                {candidateInfo.currentPosition && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center"><Briefcase className="w-4 h-4 text-indigo-500" /></div>
                    <div><p className="text-xs text-[var(--text-secondary)]">Poste actuel</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.currentPosition}</p></div>
                  </div>
                )}
                {candidateInfo.company && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center"><Building className="w-4 h-4 text-cyan-500" /></div>
                    <div><p className="text-xs text-[var(--text-secondary)]">Entreprise</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidateInfo.company}</p></div>
                  </div>
                )}
              </div>
            </div>

            {/* Section CV Upload */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center"><Upload className="w-6 h-6 text-purple-500" /></div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">CV du candidat</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{cvFile ? cvFile.name : candidateData?.cvUrl ? 'CV existant dans le système' : 'Téléchargez un PDF pour lancer l\'analyse'}</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" /><span>Uploader PDF</span>
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" disabled={analysisLoading} />
                </label>
              </div>
              {cvFile && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <CVLink file={cvFile} onAnalyze={handleAnalyzeFromLink} isAnalyzed={!!analysis} isLoading={analysisLoading} />
                </div>
              )}
              {candidateData?.cvUrl && !cvFile && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <button onClick={handleAnalyzeExistingCV} disabled={analysisLoading} className="flex items-center gap-3 p-3 bg-[var(--input-bg)] hover:bg-purple-500/10 rounded-lg transition-colors group w-full">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-purple-500" /></div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--text-primary)]">CV existant</p>
                      <p className="text-xs text-[var(--text-secondary)]">Cliquez pour analyser avec l'IA</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-purple-500 group-hover:animate-pulse" />
                  </button>
                </div>
              )}
              {!cvFile && !candidateData?.cvUrl && !analysis && !analysisLoading && !analysisError && (
                <div className="p-8 bg-[var(--bg-main)] rounded-xl text-center mt-4">
                  <FileText className="w-12 h-12 text-purple-500/30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Cliquez sur "Lancer l'analyse AI" ou uploadez un CV PDF</p>
                  <button 
                    onClick={runAnalysis}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Lancer l'analyse AI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION DROITE: ANALYSE */}
          <div className="candidate-right-section" ref={analysisRef}>
            {analysisLoading && (
              <div className="analysis-loading p-8 bg-[var(--card-bg)] border border-purple-500/30 rounded-2xl">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                  <p className="text-sm text-[var(--text-secondary)] text-center">L'IA analyse le CV et compare avec l'offre d'emploi...</p>
                </div>
              </div>
            )}

            {analysisError && !analysisLoading && (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-500 mb-1">Erreur d'analyse</h3>
                    <p className="text-sm text-red-400">{analysisError}</p>
                  </div>
                  <button onClick={runAnalysis} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Réessayer</button>
                </div>
              </div>
            )}

            {analysis && !analysisLoading && (
              <div className={`bg-[var(--card-bg)] border border-purple-500/20 rounded-2xl p-6 shadow-md transition-all duration-500 ${isNewAnalysis ? 'animate-fade-in ring-2 ring-purple-500/30' : ''}`}>
                {/* Overall Score */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Score de Compatibilité Globale</h4>
                      <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}%
                      </div>
                    </div>
                    <div className="w-32 h-32 relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={analysis.overallScore >= 70 ? '#22c55e' : analysis.overallScore >= 40 ? '#eab308' : '#ef4444'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(analysis.overallScore / 100) * 283} 283`}
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Compétences</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.categoryScores.skills)}`}>
                      {analysis.categoryScores.skills}%
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Expérience</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.categoryScores.experience)}`}>
                      {analysis.categoryScores.experience}%
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Formation</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.categoryScores.education)}`}>
                      {analysis.categoryScores.education}%
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Compétences Techniques</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.categoryScores.technicalFit)}`}>
                      {analysis.categoryScores.technicalFit}%
                    </div>
                  </div>
                </div>

                {/* Matched Skills */}
                {analysis.matchedRequirements.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-3">Compétences Matchées</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.matchedRequirements.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {analysis.missingRequirements.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-3">Compétences Manquantes</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingRequirements.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          ✗ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Points Forts
                    </h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.weaknesses.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-3">Points à Améliorer</h4>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                {analysis.recommendation && (
                  <div className={`p-4 rounded-lg ${
                    analysis.recommendation.toLowerCase().includes('yes') || analysis.recommendation.toLowerCase().includes('retenir')
                      ? 'bg-green-100 border border-green-300'
                      : analysis.recommendation.toLowerCase().includes('maybe') || analysis.recommendation.toLowerCase().includes('évaluer')
                      ? 'bg-yellow-100 border border-yellow-300'
                      : 'bg-red-100 border border-red-300'
                  }`}>
                    <h4 className="text-sm font-semibold mb-2">Recommandation</h4>
                    <p className="text-base font-medium">
                      {analysis.recommendation}
                      {analysis.priority && ` - Priorité: ${analysis.priority}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!analysis && !analysisLoading && !analysisError && (
              <div className="p-12 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl text-center">
                <Sparkles className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Analyse IA</h3>
                <p className="text-[var(--text-secondary)] mb-6">Cliquez sur le bouton pour analyser ce candidat avec l'IA</p>
                <button 
                  onClick={runAnalysis}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Lancer l'analyse AI
                </button>
              </div>
            )}
          </div>
        </div>

        <style>{`@media (max-width: 768px) { .candidate-profile-grid { grid-template-columns: 1fr !important; } }`}</style>
      </div>
    </div>
  );
}

export default CandidateProfilePage;