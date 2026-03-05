// /home/manal/projet_final_BPMS/frontend/src/features/rh/components/analysis/AIAnalysisDashboard.tsx
import React from 'react';
import { Brain, Award, Target, CheckCircle2, AlertCircle, Lightbulb, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';

interface AIAnalysisData {
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

interface AIAnalysisDashboardProps {
  analysis: AIAnalysisData;
  candidateName?: string;
  jobOfferTitle?: string;
}

export function AIAnalysisDashboard({ analysis, candidateName, jobOfferTitle }: AIAnalysisDashboardProps) {
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Analyse IA du Candidat</h2>
            <p className="text-purple-100 text-sm">
              {candidateName && `Candidat: ${candidateName}`}
              {jobOfferTitle && ` • Poste: ${jobOfferTitle}`}
            </p>
          </div>
          <Brain className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Score Global */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          Score de Compatibilité Globale
        </h3>
        
        <div className="flex items-center justify-center py-4">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={analysis.overallScore >= 60 ? '#8b5cf6' : '#f59e0b'}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
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
              Priorité: {analysis.priority === 'HIGH' ? 'Haute' : analysis.priority === 'MEDIUM' ? 'Moyenne' : 'Basse'}
            </span>
          </div>
        )}
      </div>

      {/* Scores par Catégorie */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Scores Détaillés par Catégorie
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
                    {category === 'technicalFit' && 'Compétences Techniques'}
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${getScoreBgColor(score)} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Points Forts */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Points Forts du Candidat
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
      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Points à Améliorer / Gaps
          </h3>
          <ul className="space-y-2">
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2 text-yellow-900">
                <TrendingDown className="w-4 h-4 mt-1 flex-shrink-0 text-yellow-600" />
                <span className="text-sm">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Compétences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.matchedSkills && analysis.matchedSkills.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Compétences Matchées
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

        {analysis.missingSkills && analysis.missingSkills.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Compétences Manquantes
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
            Recommandation IA
          </h3>
          <p className="text-purple-900 text-sm leading-relaxed">{analysis.recommendation}</p>
        </div>
      )}

      {/* Questions d'Entretien */}
      {analysis.interviewQuestions && analysis.interviewQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
          <h3 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-600" />
            Questions suggérées pour l'entretien
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
  );
}