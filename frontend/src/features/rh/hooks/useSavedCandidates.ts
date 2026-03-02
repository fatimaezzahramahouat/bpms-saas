import { useState, useEffect, useCallback } from 'react';

// Types
export interface SavedCandidate {
  id: string;
  jobOfferId: string;
  savedAt: string;
  labels: string[];
  notes: CandidateNote[];
}

export interface CandidateNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

// Default labels
export const DEFAULT_LABELS: Label[] = [
  { id: 'shortlist', name: 'Shortlist', color: '#22c55e' },
  { id: 'interview', name: 'Interview', color: '#3b82f6' },
  { id: 'to-review', name: 'À revoir', color: '#eab308' },
  { id: 'rejected', name: 'Rejeté', color: '#ef4444' },
];

// Storage key
const STORAGE_KEY = 'nexflow_saved_candidates';

// Load from localStorage
function loadFromStorage(): Record<string, SavedCandidate> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Save to localStorage
function saveToStorage(data: Record<string, SavedCandidate>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Custom hook for managing saved candidates
export function useSavedCandidates(jobOfferId: string) {
  const [savedCandidates, setSavedCandidates] = useState<Record<string, SavedCandidate>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    const data = loadFromStorage();
    setSavedCandidates(data);
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(savedCandidates);
    }
  }, [savedCandidates, isLoading]);

  // Get saved candidates for current job offer
  const getSavedForJob = useCallback((): SavedCandidate[] => {
    return Object.values(savedCandidates).filter(
      (candidate) => candidate.jobOfferId === jobOfferId
    );
  }, [savedCandidates, jobOfferId]);

  // Check if candidate is saved
  const isSaved = useCallback(
    (candidateId: string): boolean => {
      const key = `${jobOfferId}_${candidateId}`;
      return !!savedCandidates[key];
    },
    [savedCandidates, jobOfferId]
  );

  // Save/unsave candidate
  const toggleSave = useCallback(
    (candidateId: string): void => {
      const key = `${jobOfferId}_${candidateId}`;
      setSavedCandidates((prev) => {
        if (prev[key]) {
          // Remove
          const { [key]: removed, ...rest } = prev;
          return rest;
        } else {
          // Add
          return {
            ...prev,
            [key]: {
              id: candidateId,
              jobOfferId,
              savedAt: new Date().toISOString(),
              labels: [],
              notes: [],
            },
          };
        }
      });
    },
    [jobOfferId]
  );

  // Add label to candidate
  const addLabel = useCallback(
    (candidateId: string, label: Label): void => {
      const key = `${jobOfferId}_${candidateId}`;
      setSavedCandidates((prev) => {
        const candidate = prev[key];
        if (!candidate) return prev;

        // Check if label already exists
        if (candidate.labels.includes(label.id)) return prev;

        return {
          ...prev,
          [key]: {
            ...candidate,
            labels: [...candidate.labels, label.id],
          },
        };
      });
    },
    [jobOfferId]
  );

  // Remove label from candidate
  const removeLabel = useCallback(
    (candidateId: string, labelId: string): void => {
      const key = `${jobOfferId}_${candidateId}`;
      setSavedCandidates((prev) => {
        const candidate = prev[key];
        if (!candidate) return prev;

        return {
          ...prev,
          [key]: {
            ...candidate,
            labels: candidate.labels.filter((l) => l !== labelId),
          },
        };
      });
    },
    [jobOfferId]
  );

  // Add note to candidate
  const addNote = useCallback(
    (candidateId: string, content: string): void => {
      const key = `${jobOfferId}_${candidateId}`;
      const now = new Date().toISOString();

      setSavedCandidates((prev) => {
        const candidate = prev[key];
        if (!candidate) return prev;

        const newNote: CandidateNote = {
          id: `note_${Date.now()}`,
          content,
          createdAt: now,
          updatedAt: now,
        };

        return {
          ...prev,
          [key]: {
            ...candidate,
            notes: [newNote, ...candidate.notes],
          },
        };
      });
    },
    [jobOfferId]
  );

  // Update note
  const updateNote = useCallback(
    (candidateId: string, noteId: string, content: string): void => {
      const key = `${jobOfferId}_${candidateId}`;
      const now = new Date().toISOString();

      setSavedCandidates((prev) => {
        const candidate = prev[key];
        if (!candidate) return prev;

        return {
          ...prev,
          [key]: {
            ...candidate,
            notes: candidate.notes.map((note) =>
              note.id === noteId
                ? { ...note, content, updatedAt: now }
                : note
            ),
          },
        };
      });
    },
    [jobOfferId]
  );

  // Delete note
  const deleteNote = useCallback(
    (candidateId: string, noteId: string): void => {
      const key = `${jobOfferId}_${candidateId}`;

      setSavedCandidates((prev) => {
        const candidate = prev[key];
        if (!candidate) return prev;

        return {
          ...prev,
          [key]: {
            ...candidate,
            notes: candidate.notes.filter((note) => note.id !== noteId),
          },
        };
      });
    },
    [jobOfferId]
  );

  // Get candidate data
  const getCandidateData = useCallback(
    (candidateId: string): SavedCandidate | null => {
      const key = `${jobOfferId}_${candidateId}`;
      return savedCandidates[key] || null;
    },
    [savedCandidates, jobOfferId]
  );

  return {
    savedCandidates,
    isLoading,
    isSaved,
    toggleSave,
    addLabel,
    removeLabel,
    addNote,
    updateNote,
    deleteNote,
    getCandidateData,
    getSavedForJob,
  };
}

export default useSavedCandidates;
