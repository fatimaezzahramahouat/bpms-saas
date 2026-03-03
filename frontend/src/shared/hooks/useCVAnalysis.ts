import { useState, useCallback } from 'react';
import { 
  extractTextFromPDF, 
  analyzeCVWithGemini, 
  CandidateAnalysis 
} from '../services/geminiService';

interface UseCVAnalysisReturn {
  analysis: CandidateAnalysis | null;
  loading: boolean;
  error: string | null;
  performAnalysis: (cvFile: File) => Promise<CandidateAnalysis | null>;
  reset: () => void;
}

/**
 * Custom hook for CV analysis using Gemini API
 * Provides states and function to perform CV analysis
 */
export function useCVAnalysis(): UseCVAnalysisReturn {
  const [analysis, setAnalysis] = useState<CandidateAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = useCallback(async (cvFile: File): Promise<CandidateAnalysis | null> => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Step 1: Extract text from PDF
      const cvText = await extractTextFromPDF(cvFile);
      
      if (!cvText || cvText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      // Step 2: Analyze with Gemini
      const result = await analyzeCVWithGemini(cvText);
      
      setAnalysis(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during analysis';
      setError(errorMessage);
      console.error('CV Analysis Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    performAnalysis,
    reset,
  };
}

export default useCVAnalysis;
