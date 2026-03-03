// frontend/src/components/CandidateAnalysis.tsx
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  Briefcase,
  TrendingUp,
  Clock,
  BookOpen,
  Code
} from 'lucide-react';

// Types
interface CVData {
  name?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  [key: string]: unknown;
}

interface JobOfferData {
  title?: string;
  requiredSkills?: string[];
  experienceRequired?: string;
  educationRequired?: string;
  [key: string]: unknown;
}

interface Analysis {
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
  recommendation: {
    decision: string;
    priority: string;
    interviewQuestions: string[];
    notes: string;
  };
}

interface CandidateAnalysisProps {
  candidateId?: string;
  cvData: CVData;
  jobOfferData: JobOfferData;
}

const CandidateAnalysis: React.FC<CandidateAnalysisProps> = ({ 
  candidateId, 
  cvData, 
  jobOfferData 
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleAnalysis = async () => {
    if (!showAnalysis) {
      if (!analysis) {
        await fetchAnalysis();
      }
    }
    setShowAnalysis(!showAnalysis);
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/analyze-candidate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          cvData,
          jobOfferData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data.analysis);
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Connection error to backend');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 70) return 'from-green-500 to-emerald-500';
    if (score >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      
      {/* ==================== Main Button ==================== */}
      <button
        onClick={handleToggleAnalysis}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 
                   hover:from-purple-700 hover:to-violet-700 
                   text-white font-semibold py-5 px-8 rounded-2xl 
                   shadow-xl transform transition-all duration-200 
                   hover:scale-[1.02] active:scale-[0.98] 
                   flex items-center justify-center gap-3 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   border border-purple-400/30"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-lg">Analyse en cours...</span>
          </>
        ) : (
          <>
            <FileText className="w-6 h-6" />
            <span className="text-lg">
              {showAnalysis ? 'Masquer l\'analyse complète' : 'Voir l\'analyse complète (AI)'}
            </span>
            {showAnalysis ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </>
        )}
      </button>

      {/* ==================== Error Message ==================== */}
      {error && (
        <div className="mt-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl text-red-800 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <span className="font-medium">⚠️ {error}</span>
        </div>
      )}

      {/* ==================== Analysis Panel ==================== */}
      {showAnalysis && analysis && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          
          {/* ========== Overall Score ========== */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-purple-100">
            <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-600" />
              Score de Compatibilité Globale
            </h3>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Circle */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={analysis.overallScore >= 70 ? "#10b981" : analysis.overallScore >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${analysis.overallScore * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.overallScore}%
                  </span>
                </div>
              </div>

              {/* Score Description */}
              <div className="flex-1 text-center md:text-left">
                <p className={`text-2xl font-bold mb-3 ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore >= 70 ? "🎉 Excellent candidat !" : 
                   analysis.overallScore >= 50 ? "👍 Candidat prometteur" : "⚠️ Candidat à revoir"}
                </p>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {analysis.recommendation?.notes || 'Analyse non disponible'}
                </p>
                
                {/* Decision Badges */}
                <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                  <span className={`px-5 py-2 rounded-full font-bold text-white ${
                    analysis.recommendation?.decision === 'Yes' ? 'bg-green-500' :
                    analysis.recommendation?.decision === 'Maybe' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {analysis.recommendation?.decision === 'Yes' ? '✓ Convier à un entretien' :
                     analysis.recommendation?.decision === 'Maybe' ? '? À reconsidérer' : '✗ Ne pas retenir'}
                  </span>
                  
                  <span className={`px-5 py-2 rounded-full font-bold ${
                    analysis.recommendation?.priority === 'High' ? 'bg-red-100 text-red-800' :
                    analysis.recommendation?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    Priorité: {analysis.recommendation?.priority === 'High' ? 'Haute' :
                               analysis.recommendation?.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== Category Scores ========== */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-blue-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-blue-600" />
              Scores Détaillés par Catégorie
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'skills', label: 'Compétences', icon: Code },
                { key: 'experience', label: 'Expérience', icon: Clock },
                { key: 'education', label: 'Formation', icon: BookOpen },
                { key: 'technicalFit', label: 'Compétences Techniques', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => {
                const score = analysis.categoryScores?.[key as keyof typeof analysis.categoryScores] || 0;
                return (
                  <div key={key} className="space-y-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-700">{label}</span>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${getScoreBgColor(score)} transition-all duration-1000`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========== Strengths ========== */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl shadow-xl p-8 border-2 border-green-200">
            <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
              <CheckCircle className="w-7 h-7" />
              Points Forts du Candidat
            </h3>
            <ul className="space-y-3">
              {(analysis.strengths || []).map((strength, index) => (
                <li key={index} className="flex items-start gap-3 text-green-900 bg-white/50 p-3 rounded-xl">
                  <span className="text-green-600 font-bold text-lg mt-0.5">✓</span>
                  <span className="text-lg">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ========== Weaknesses ========== */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-3xl shadow-xl p-8 border-2 border-orange-200">
            <h3 className="text-2xl font-bold text-orange-800 mb-6 flex items-center gap-3">
              <AlertCircle className="w-7 h-7" />
              Points à Améliorer / Gaps
            </h3>
            <ul className="space-y-3">
              {(analysis.weaknesses || []).map((weakness, index) => (
                <li key={index} className="flex items-start gap-3 text-orange-900 bg-white/50 p-3 rounded-xl">
                  <span className="text-orange-600 font-bold text-lg mt-0.5">⚠</span>
                  <span className="text-lg">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ========== Matched vs Missing Requirements ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-green-100">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Compétences Matchées
              </h3>
              <ul className="space-y-2">
                {(analysis.matchedRequirements || []).map((req, index) => (
                  <li key={index} className="text-green-700 text-base flex items-center gap-2 bg-green-50 p-2 rounded-lg">
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                    <span>{req}</span>
                  </li>
                ))}
                {(!(analysis.matchedRequirements || []).length) && (
                  <li className="text-gray-500 italic">Aucune donnée</li>
                )}
              </ul>
            </div>

            {/* Missing */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-red-100">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Compétences Manquantes
              </h3>
              <ul className="space-y-2">
                {(analysis.missingRequirements || []).map((req, index) => (
                  <li key={index} className="text-red-700 text-base flex items-center gap-2 bg-red-50 p-2 rounded-lg">
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                    <span>{req}</span>
                  </li>
                ))}
                {(!(analysis.missingRequirements || []).length) && (
                  <li className="text-gray-500 italic">Aucune donnée</li>
                )}
              </ul>
            </div>
          </div>

          {/* ========== HR Recommendations ========== */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-100 rounded-3xl shadow-xl p-8 border-2 border-purple-200">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-3">
              <Briefcase className="w-7 h-7" />
              Recommandations RH & Questions d'Entretien
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-4 text-lg">📋 Questions suggérées pour l'entretien:</h4>
                <ul className="space-y-3">
                  {(analysis.recommendation?.interviewQuestions || []).map((question, index) => (
                    <li key={index} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
                      <span className="font-bold text-purple-600 mr-2">{index + 1}.</span>
                      <span className="text-gray-700">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================== Animation CSS ==================== */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CandidateAnalysis;