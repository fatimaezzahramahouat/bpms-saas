// /home/manal/projet_final_BPMS/frontend/src/features/rh/components/AIAnalysisPanel.tsx
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle, ThumbsUp, TrendingUp, Award, BookOpen } from 'lucide-react';

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
}

interface AIAnalysisPanelProps {
  candidateId: string;
  jobOfferId: string;
  cvData: CVData;
  jobOfferData: JobOfferData;
}

export function AIAnalysisPanel({ 
  candidateId, 
  jobOfferId, 
  cvData, 
  jobOfferData 
}: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📥 AIAnalysisPanel props:', {
      candidateId,
      jobOfferId,
      cvData,
      jobOfferData
    });
  }, [candidateId, jobOfferId, cvData, jobOfferData]);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Calling analysis API...');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/analyze-candidate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          candidateId,
          jobOfferId,
          cvData,
          jobOfferData
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);
      
      if (result.success && result.data) {
        const backendData = result.data;
        const analysisObj = backendData.analysis || backendData;
        
        const formattedAnalysis: AnalysisState = {
          overallScore: analysisObj.overallScore || 0,
          categoryScores: {
            skills: analysisObj.categoryScores?.skills || 0,
            experience: analysisObj.categoryScores?.experience || 0,
            education: analysisObj.categoryScores?.education || 0,
            technicalFit: analysisObj.categoryScores?.technicalFit || 0,
          },
          matchedRequirements: analysisObj.matchedRequirements || [],
          missingRequirements: analysisObj.missingRequirements || [],
          strengths: analysisObj.strengths || [],
          weaknesses: analysisObj.weaknesses || [],
          recommendation: analysisObj.recommendation?.decision || analysisObj.recommendation,
          priority: analysisObj.recommendation?.priority || analysisObj.priority,
        };

        console.log('📊 Formatted analysis:', formattedAnalysis);
        setAnalysis(formattedAnalysis);
      }
    } catch (err) {
      console.error('❌ Analysis error:', err);
      setError(`Erreur: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Analyse IA des compétences</h3>
        </div>
        
        {!analysis && !isLoading && (
          <button
            onClick={runAnalysis}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Lancer l'analyse
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
          <p className="text-gray-600">L'IA analyse le CV...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
          <button
            onClick={runAnalysis}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Score de Compatibilité Globale</h4>
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}%
                </div>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
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
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isLoading && !error && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-600">Cliquez sur "Lancer l'analyse" pour obtenir une analyse IA</p>
        </div>
      )}
    </div>
  );
}

export default AIAnalysisPanel;