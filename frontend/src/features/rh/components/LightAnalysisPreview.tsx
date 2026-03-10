import React, { useEffect, useMemo } from 'react';
import { ThumbsUp, AlertTriangle, XCircle, CheckCircle, TrendingUp, Star, Target, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Analysis data interface - matches the GeminiAnalysis structure
export interface LightAnalysisData {
  overallScore?: number;
  recommendation?: string;
  strengths?: string[];
  weaknesses?: string[];
  skillsMatch?: {
    matched?: string[];
    missing?: string[];
    percentage?: number;
  };
  // Backward compatibility
  score?: number;
  pointsForts?: string[];
  pointsFaibles?: string[];
}

interface LightAnalysisPreviewProps {
  analysis?: LightAnalysisData | null;
  candidateId: string;
  jobOfferId: string;
}

// Get recommendation status based on score
const getRecommendationStatus = (score: number, recommendation?: string): { label: string; color: string; bgColor: string; icon: React.ReactNode } => {
  // First check explicit recommendation string
  if (recommendation) {
    const recLower = recommendation.toLowerCase();
    if (recLower.includes('excellent') || recLower.includes('à retenir') || recLower.includes('recommended')) {
      return {
        label: 'Recommandé',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      };
    }
    if (recLower.includes('à évaluer') || recLower.includes('review') || recLower.includes('may be')) {
      return {
        label: 'À revoir',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }
    if (recLower.includes('non recommandé') || recLower.includes('not recommended') || recLower.includes('reject')) {
      return {
        label: 'Non recommandé',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
  }
  
  // Fall back to score-based determination
  if (score >= 80) {
    return {
      label: 'Excellent',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <Star className="w-3.5 h-3.5" />,
    };
  }
  if (score >= 60) {
    return {
      label: 'Recommandé',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
    };
  }
  if (score >= 40) {
    return {
      label: 'À revoir',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    };
  }
  return {
    label: 'Non recommandé',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: <XCircle className="w-3.5 h-3.5" />,
  };
};

export function LightAnalysisPreview({ analysis, candidateId, jobOfferId }: LightAnalysisPreviewProps) {
  // ✅ Diagnostic logs - log when component receives new analysis
  console.log('🔍 [LightAnalysisPreview] Received:', {
    candidateId,
    score: analysis?.overallScore ?? analysis?.score,
    hasData: !!analysis,
    timestamp: new Date().toISOString()
  });

  // ✅ Force re-calculation when analysis changes using useMemo
  const score = useMemo(() => {
    const result = analysis?.overallScore ?? analysis?.score ?? 0;
    console.log('🔍 [LightAnalysisPreview] Score calculated:', {
      candidateId,
      overallScore: analysis?.overallScore,
      score: analysis?.score,
      result,
      timestamp: new Date().toISOString()
    });
    return result;
  }, [analysis?.overallScore, analysis?.score, candidateId, analysis]);

  // Get strengths (handle backward compatibility)
  const strengths = useMemo(() => {
    return analysis?.strengths || analysis?.pointsForts || [];
  }, [analysis?.strengths, analysis?.pointsForts]);
  
  // Get weaknesses/missing skills (handle backward compatibility)
  const missingSkills = useMemo(() => {
    return analysis?.weaknesses || analysis?.pointsFaibles || analysis?.skillsMatch?.missing || [];
  }, [analysis?.weaknesses, analysis?.pointsFaibles, analysis?.skillsMatch]);
  
  // Get recommendation
  const status = useMemo(() => {
    return getRecommendationStatus(score, analysis?.recommendation);
  }, [score, analysis?.recommendation]);
  
  // Get top 3 strengths (truncated if needed)
  const displayStrengths = useMemo(() => {
    return strengths.slice(0, 3);
  }, [strengths]);
  
  // Get top missing skill
  const topMissingSkill = useMemo(() => {
    return missingSkills[0];
  }, [missingSkills]);

  // ✅ Add revalidation when page becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [LightAnalysisPreview] Page visible, triggering refresh:', {
          candidateId,
          jobOfferId,
          timestamp: new Date().toISOString()
        });
        // Trigger parent to refresh via custom event
        window.dispatchEvent(new CustomEvent('refresh-analysis', {
          detail: { candidateId, jobOfferId }
        }));
      }
    };

    const handleFocus = () => {
      console.log('🎯 [LightAnalysisPreview] Window focused, triggering refresh:', {
        candidateId,
        jobOfferId,
        timestamp: new Date().toISOString()
      });
      window.dispatchEvent(new CustomEvent('refresh-analysis', {
        detail: { candidateId, jobOfferId }
      }));
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [candidateId, jobOfferId]);

  // If no analysis data, show a placeholder state
  if (!analysis || score === 0) {
    return (
      <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Analyse IA</span>
          </div>
          {/* Status Badge */}
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
            <AlertTriangle className="w-3 h-3" />
            Non analysé
          </span>
        </div>
        
        {/* No Analysis State */}
        <div className="text-center py-3">
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Aucune analyse disponible
          </p>
          <Link
            to={`/dashboard/rh/candidates/${candidateId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyser
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-4">
      {/* Header with Score and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Analyse IA</span>
        </div>
        
        {/* Compatibility Score */}
        <div className="flex items-center gap-2">
          <div className={`text-lg font-bold ${
            score >= 80 ? 'text-green-400' :
            score >= 60 ? 'text-green-400' :
            score >= 40 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {score}%
          </div>
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      {/* Compatibility Bar */}
      <div className="mb-3">
        <div className="h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' :
              score >= 60 ? 'bg-green-500' :
              score >= 40 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Key Strengths */}
      {displayStrengths.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Points forts</span>
          </div>
          <ul className="space-y-1">
            {displayStrengths.map((strength, index) => (
              <li key={index} className="text-xs text-green-400 flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                <span className="line-clamp-1" title={strength}>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Missing Skill */}
      {topMissingSkill && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Compérence manquante</span>
          </div>
          <div className="text-xs text-orange-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1" title={topMissingSkill}>{topMissingSkill}</span>
          </div>
        </div>
      )}

      {/* View Full Analysis Link */}
      <Link
        to={`/dashboard/rh/candidates/${candidateId}`}
        className="flex items-center justify-center gap-1.5 w-full py-2 mt-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 text-xs font-medium rounded-lg transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5" />
        Voir analyse complète
      </Link>
    </div>
  );
}

export default LightAnalysisPreview;
