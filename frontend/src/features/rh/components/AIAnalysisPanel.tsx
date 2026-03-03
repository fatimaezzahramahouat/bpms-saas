import { useState, useEffect } from 'react';
import { Sparkles, Brain, Target, ThumbsUp, ThumbsDown, AlertTriangle, Loader2, RefreshCw, ChevronDown, ChevronUp, BarChart3, TrendingUp, Award } from 'lucide-react';
import { GeminiAnalysis, analyzeCandidate, calculateQuickMatch, getMockAnalysis, CandidateProfile, JobRequirements } from '../../../shared/services/geminiService';
import { MatchingPercentage } from './MatchingPercentage';
import { SkillsRadarChart, ExperienceTimeline, CompetencyBars, AIAnalysisText, ScoreBreakdown } from './AIVisualizations';

interface AIAnalysisPanelProps {
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    skills: string[];
    experienceLevel: string;
    education: string;
    coverLetter?: string;
  };
  jobRequirements: {
    title: string;
    requiredSkills: string[];
    requiredExperience: string;
    requiredEducation: string;
  };
  onAnalysisComplete?: (analysis: GeminiAnalysis) => void;
}

export function AIAnalysisPanel({ 
  candidate, 
  jobRequirements,
  onAnalysisComplete 
}: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create candidate profile
      const candidateProfile: CandidateProfile = {
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        skills: candidate.skills,
        experience: candidate.experienceLevel,
        education: candidate.education,
        coverLetter: candidate.coverLetter,
      };

      const job: JobRequirements = {
        title: jobRequirements.title,
        requiredSkills: jobRequirements.requiredSkills,
        requiredExperience: jobRequirements.requiredExperience,
        requiredEducation: jobRequirements.requiredEducation,
      };

      // Call Gemini API (with fallback to mock)
      const result = await analyzeCandidate(candidateProfile, job);
      setAnalysis(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError('Erreur lors de l\'analyse IA');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run quick offline analysis as fallback
  const runQuickAnalysis = () => {
    const quickResult = calculateQuickMatch(
      candidate.skills,
      jobRequirements.requiredSkills,
      candidate.experienceLevel,
      jobRequirements.requiredExperience
    );

    const result: GeminiAnalysis = {
      overallScore: quickResult.percentage,
      categoryScores: {
        skills: quickResult.percentage,
        experience: quickResult.percentage,
        education: 70,
        technicalFit: quickResult.percentage,
      },
      matchedRequirements: quickResult.matched,
      missingRequirements: quickResult.missing,
      skillsMatch: {
        matched: quickResult.matched,
        missing: quickResult.missing,
        percentage: quickResult.percentage,
      },
      experienceMatch: {
        required: jobRequirements.requiredExperience,
        candidate: candidate.experienceLevel,
        percentage: quickResult.percentage,
      },
      strengths: quickResult.matched.map(s => `Compétence en ${s}`),
      weaknesses: quickResult.missing.map(s => `Manque de ${s}`),
      recommendation: quickResult.percentage >= 70 ? 'À retenir' : quickResult.percentage >= 40 ? 'À évaluer' : 'Non recommandé',
      detailedAnalysis: `Analyse rapide basée sur la correspondance des compétences et de l'expérience.`,
      linguisticAnalysis: {
        writingQuality: 'Non évalué (analyse rapide)',
        professionalTone: 'Non évalué (analyse rapide)',
        communicationSkills: 'Non évalué (analyse rapide)',
      },
    };

    setAnalysis(result);
    if (onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  };

  // Get recommendation color
  const getRecommendationColor = (recommendation: string): string => {
    switch (recommendation) {
      case 'À retenir':
        return 'text-green-500';
      case 'À évaluer':
        return 'text-yellow-500';
      case 'Non recommandé':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get recommendation icon
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'À retenir':
        return <ThumbsUp className="w-5 h-5" />;
      case 'À évaluer':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Non recommandé':
        return <ThumbsDown className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-purple-500/20 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Analyse IA</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={runQuickAnalysis}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--input-bg)] hover:bg-purple-500/10 hover:text-purple-400 rounded-lg transition-colors"
          >
            Analyse rapide
          </button>
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Brain className="w-3 h-3" />
                Analyser
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">
            L'IA analyse le profil du candidat...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={runQuickAnalysis}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300"
          >
            Essayer l'analyse rapide
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isLoading && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="p-4 bg-[var(--bg-main)] rounded-lg">
            <MatchingPercentage percentage={analysis.overallScore} showCircular={true} size="sm" />
          </div>

          {/* Recommendation */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            analysis.recommendation === 'À retainer' ? 'bg-green-500/10' :
            analysis.recommendation === 'À évaluer' ? 'bg-yellow-500/10' :
            'bg-red-500/10'
          }`}>
            <span className={getRecommendationColor(analysis.recommendation)}>
              {getRecommendationIcon(analysis.recommendation)}
            </span>
            <span className={`font-medium ${getRecommendationColor(analysis.recommendation)}`}>
              {analysis.recommendation}
            </span>
          </div>

          {/* Skills Match */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              Compétences
            </h4>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {analysis.skillsMatch.matched.map((skill, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded-md">
                    ✓ {skill}
                  </span>
                ))}
              </div>
              {analysis.skillsMatch.missing.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.skillsMatch.missing.map((skill, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded-md">
                      ✗ {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                Points forts
              </h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, i) => (
                  <li key={i} className="text-sm text-green-400 flex items-start gap-2">
                    <span className="mt-1 w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Points à améliorer
              </h4>
              <ul className="space-y-1">
                {analysis.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-sm text-yellow-400 flex items-start gap-2">
                    <span className="mt-1 w-1 h-1 rounded-full bg-yellow-400 flex-shrink-0" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Analysis Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-2 text-sm text-[var(--text-secondary)] hover:text-purple-400 transition-colors"
          >
            <span>Analyse détaillée avec graphiques</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Detailed Analysis Content with Visualizations */}
          {showDetails && analysis && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              {/* Score Breakdown */}
              <div className="p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  Répartition du score
                </h4>
                <ScoreBreakdown
                  overallScore={analysis.overallScore}
                  skillsScore={analysis.skillsMatch.percentage}
                  experienceScore={analysis.experienceMatch.percentage}
                  educationScore={70}
                  linguisticScore={75}
                />
              </div>

              {/* Skills Radar Chart */}
              <div className="p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Comparaison des compétences
                </h4>
                <SkillsRadarChart
                  requiredSkills={jobRequirements.requiredSkills}
                  candidateSkills={candidate.skills}
                />
              </div>

              {/* Experience Timeline */}
              <div className="p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Timeline d'expérience
                </h4>
                <ExperienceTimeline
                  requiredYears={jobRequirements.requiredExperience}
                  candidateYears={candidate.experienceLevel}
                />
              </div>

              {/* Competency Bars */}
              <div className="p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  Compétences
                </h4>
                <CompetencyBars
                  technicalSkills={analysis.skillsMatch.percentage}
                  softSkills={75}
                  education={70}
                  languages={80}
                />
              </div>

              {/* AI Written Analysis */}
              <AIAnalysisText
                analysis={analysis.detailedAnalysis}
                strengths={analysis.strengths}
                weaknesses={analysis.weaknesses}
              />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isLoading && !error && (
        <div className="text-center py-6">
          <Brain className="w-12 h-12 text-purple-500/30 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Cliquez sur "Analyser" pour obtenir une analyse IA du candidat
          </p>
        </div>
      )}
    </div>
  );
}

export default AIAnalysisPanel;
