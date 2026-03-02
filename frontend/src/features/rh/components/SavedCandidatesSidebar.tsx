import { useState } from 'react';
import { X, Heart, Bookmark, User, Trash2, Plus, Tag, XCircle } from 'lucide-react';
import { SavedCandidate, Label, DEFAULT_LABELS } from '../hooks/useSavedCandidates';

interface SavedCandidatesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  savedCandidates: SavedCandidate[];
  allCandidates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  }>;
  onRemoveSaved: (candidateId: string) => void;
  onAddLabel: (candidateId: string, label: Label) => void;
  onRemoveLabel: (candidateId: string, labelId: string) => void;
}

export function SavedCandidatesSidebar({
  isOpen,
  onClose,
  savedCandidates,
  allCandidates,
  onRemoveSaved,
  onAddLabel,
  onRemoveLabel,
}: SavedCandidatesSidebarProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showLabelMenu, setShowLabelMenu] = useState<string | null>(null);

  // Get candidate details
  const getCandidate = (id: string) =>
    allCandidates.find((c) => c.id === id);

  // Get saved candidate data
  const getSavedData = (id: string) =>
    savedCandidates.find((s) => s.id === id);

  // Get label details
  const getLabel = (labelId: string) =>
    DEFAULT_LABELS.find((l) => l.id === labelId);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-[var(--bg-main)] border-l border-[var(--border-color)] z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className="font-semibold text-[var(--text-primary)]">
              Candidats sauvegardés
            </h2>
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-full">
              {savedCandidates.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {savedCandidates.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="w-12 h-12 text-purple-500/30 mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">
                Aucun candidat sauvegardé
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Cliquez sur le cœur pour sauvegarder un candidat
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedCandidates.map((saved) => {
                const candidate = getCandidate(saved.id);
                if (!candidate) return null;

                const savedData = getSavedData(saved.id);
                const labels = savedData?.labels || [];

                return (
                  <div
                    key={saved.id}
                    className="p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg"
                  >
                    {/* Candidate Info */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {candidate.firstName[0]}
                          {candidate.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {candidate.firstName} {candidate.lastName}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {candidate.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveSaved(saved.id)}
                        className="p-1 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Labels */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {labels.map((labelId) => {
                        const label = getLabel(labelId);
                        if (!label) return null;

                        return (
                          <span
                            key={labelId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${label.color}20`,
                              color: label.color,
                            }}
                          >
                            {label.name}
                            <button
                              onClick={() => onRemoveLabel(saved.id, labelId)}
                              className="hover:opacity-70"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}

                      {/* Add Label Button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowLabelMenu(
                              showLabelMenu === saved.id ? null : saved.id
                            )
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                        >
                          <Plus className="w-3 h-3" />
                          Label
                        </button>

                        {/* Label Menu */}
                        {showLabelMenu === saved.id && (
                          <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg z-10">
                            {DEFAULT_LABELS.filter(
                              (l) => !labels.includes(l.id)
                            ).map((label) => (
                              <button
                                key={label.id}
                                onClick={() => {
                                  onAddLabel(saved.id, label);
                                  setShowLabelMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--input-bg)]"
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span className="text-[var(--text-primary)]">
                                  {label.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <p className="text-xs text-[var(--text-secondary)]">
                      Sauvegardé le{' '}
                      {new Date(saved.savedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SavedCandidatesSidebar;
