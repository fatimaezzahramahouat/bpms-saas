// /home/manal/projet_final_BPMS/frontend/src/features/rh/pages/CandidateProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, AlertCircle, User, Mail, Phone, 
  FileText, Brain, Award, Target, CheckCircle2, 
  TrendingUp, TrendingDown, Lightbulb, MessageSquare 
} from 'lucide-react';

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  cv?: string;
  status: string;
  createdAt: string;
  applications?: Array<{
    id: string;
    jobOfferId: string;
    jobOffer?: {
      id: string;
      title: string;
    };
  }>;
}

interface AIAnalysis {
  overallScore: number;
  categoryScores: {
    skills?: number;
    experience?: number;
    education?: number;
    technicalFit?: number;
  };
  strengths: string[];
  weaknesses: string[];
  matchedSkills: string[];
  missingSkills: string[];
  recommendation?: string;
  priority?: string;
  interviewQuestions: string[];
}

export function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'analysis'>('profile');
  // ✅ useEffect واحد فقط - نظيف وبدون تكرار
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        
        const candidateRes = await fetch(`http://localhost:5000/api/candidates/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!candidateRes.ok) throw new Error('Failed to fetch candidate');
        
        const candidateData = await candidateRes.json();
        setCandidate(candidateData.data || candidateData);
        
        const jobOfferId = candidateData.applications?.[0]?.jobOfferId;
        if (jobOfferId) {
          try {
            const analysisRes = await fetch(
              `http://localhost:5000/api/analyze-candidate/${id}/${jobOfferId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (analysisRes.ok) {
              const analysisData = await analysisRes.json();
              if (analysisData.data?.analysis) {
                console.log('✅ Analysis found!');
                setAnalysis(analysisData.data.analysis);
                setActiveTab('analysis');
              }
            }
          } catch (err) {
            console.log('⏳ No analysis yet');
          }
        }
        
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err instanceof Error ? err.message : 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    const intervalId = setInterval(() => {
      if (!analysis) {
        console.log('🔄 Checking...');
        fetchData();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
    
  }, [id, analysis]);  // ✅ هذا هو الإغلاق الوحيد - لا شيء بعده!

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error || 'Candidat non trouvé'}</p>
          <button
            onClick={() => navigate('/dashboard/rh/candidates')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Profil
              </button>
              {analysis && (
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'analysis'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Analyse IA
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profile' ? (
          /* PROFIL TAB */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {candidate.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{candidate.fullName}</h1>
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <span>{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.cv && (
                    <a href={candidate.cv} target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                      <FileText className="w-5 h-5" />
                      <span>Voir CV</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {!analysis && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">Analyse IA en cours</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      L'analyse est en cours. Rafraîchissez la page dans quelques instants.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ANALYSIS TAB */
          analysis && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">🧠 ANALYSE IA DU CANDIDAT</h2>
                    <p className="text-purple-100 text-sm">
                      Candidat: {candidate.fullName}
                      {candidate.applications?.[0]?.jobOffer?.title && 
                        ` • Poste: ${candidate.applications[0].jobOffer.title}`}
                    </p>
                  </div>
                  <Brain className="w-12 h-12 opacity-50" />
                </div>
              </div>

              {/* Score Global */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  🏆 SCORE DE COMPATIBILITÉ GLOBALE
                </h3>
                
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                      <circle
                        cx="80" cy="80" r="70"
                        stroke={analysis.overallScore >= 60 ? '#8b5cf6' : '#f59e0b'}
                        strokeWidth="12" fill="none" strokeLinecap="round"
                        strokeDasharray={`${(analysis.overallScore / 100) * 440} 440`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}%
                      </span>
                      <span className="text-gray-500 text-sm mt-1">Compatibilité</span>
                    </div>
                  </div>
                </div>

                {analysis.priority && (
                  <div className="flex justify-center mt-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                      analysis.priority === 'HIGH' ? 'bg-red-100 text-red-700 border-red-300' :
                      analysis.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-green-100 text-green-700 border-green-300'
                    }`}>
                      Priorité: {analysis.priority === 'HIGH' ? 'Haute' : 
                                analysis.priority === 'MEDIUM' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>
                )}
              </div>

              {/* Scores par Catégorie */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  🎯 SCORES DÉTAILLÉS PAR CATÉGORIE
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysis.categoryScores).map(([category, score]) => (
                    score !== null && score !== undefined && (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {category === 'skills' && 'Compétences'}
                            {category === 'experience' && 'Expérience'}
                            {category === 'education' && 'Formation'}
                            {category === 'technicalFit' && 'Comp. Techniques'}
                          </span>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${getScoreBgColor(score)} transition-all duration-1000`} 
                               style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Points Forts */}
              {analysis.strengths?.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ✅ POINTS FORTS DU CANDIDAT
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-green-900">
                        <TrendingUp className="w-4 h-4 mt-1 flex-shrink-0 text-green-600" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Points à Améliorer */}
              {analysis.weaknesses?.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-yellow-600" />
                    ⚠️ POINTS À AMÉLIORER / GAPS
                  </h3>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-yellow-900">
                        <span className="text-sm">• {weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compétences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.matchedSkills?.length > 0 && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      📚 COMPÉTENCES MATCHÉES
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.matchedSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.missingSkills?.length > 0 && (
                  <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                    <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      ❌ COMPÉTENCES MANQUANTES
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommandation */}
              {analysis.recommendation && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    💡 RECOMMANDATION IA
                  </h3>
                  <p className="text-purple-900 text-sm leading-relaxed">{analysis.recommendation}</p>
                </div>
              )}

              {/* Questions d'Entretien */}
              {analysis.interviewQuestions?.length > 0 && (
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
                  <h3 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-pink-600" />
                    💬 QUESTIONS SUGGÉRÉES
                  </h3>
                  <ol className="space-y-3">
                    {analysis.interviewQuestions.map((question, index) => (
                      <li key={index} className="flex items-start gap-3 text-pink-900">
                        <span className="flex-shrink-0 w-6 h-6 bg-pink-200 text-pink-800 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm">{question}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}