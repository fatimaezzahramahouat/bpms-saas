import { useState } from 'react';
import { X, AlertTriangle, Trash2, UserMinus, CheckCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  onConfirmReject: (reason?: string) => void;
  candidateName: string;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirmDelete,
  onConfirmReject,
  candidateName,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const [activeTab, setActiveTab] = useState<'delete' | 'reject'>('delete');
  const [rejectReason, setRejectReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (activeTab === 'delete') {
      if (!showConfirmation) {
        setShowConfirmation(true);
        return;
      }
      onConfirmDelete();
    } else {
      onConfirmReject(rejectReason);
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setRejectReason('');
    onClose();
  };

  const predefinedReasons = [
    'Profil ne correspond pas aux exigences',
    'Expérience insuffisante',
    'Compétences manquantes',
    'Disponibilité incompatible',
    'Autre raison',
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'delete' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                {activeTab === 'delete' ? (
                  <Trash2 className="w-5 h-5 text-red-500" />
                ) : (
                  <UserMinus className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {activeTab === 'delete' ? 'Supprimer la candidature' : 'Rejeter la candidature'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Candidate Name */}
            <p className="text-[var(--text-primary)]">
              Vous êtes sur le point de{' '}
              <span className="font-semibold">{activeTab === 'delete' ? 'supprimer' : 'rejeter'}</span> la candidature de{' '}
              <span className="font-semibold">{candidateName}</span>.
            </p>

            {/* Tab Selection */}
            <div className="flex gap-2 p-1 bg-[var(--input-bg)] rounded-lg">
              <button
                onClick={() => { setActiveTab('reject'); setShowConfirmation(false); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'reject'
                    ? 'bg-yellow-500 text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <UserMinus className="w-4 h-4 inline mr-2" />
                Rejeter
              </button>
              <button
                onClick={() => { setActiveTab('delete'); setShowConfirmation(false); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'delete'
                    ? 'bg-red-500 text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Supprimer
              </button>
            </div>

            {/* Reject Reason (only for reject tab) */}
            {activeTab === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Raison du rejet (optionnel)
                </label>
                <div className="space-y-2">
                  {predefinedReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setRejectReason(reason)}
                      className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                        rejectReason === reason
                          ? 'border-yellow-500 bg-yellow-500/10 text-[var(--text-primary)]'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500/50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Autre raison..."
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-yellow-500 resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Warning for delete */}
            {activeTab === 'delete' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      Attention
                    </p>
                    <p className="text-xs text-red-400/80 mt-1">
                      Cette action est irréversible. La candidature sera définitivement supprimée.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation checkbox for delete */}
            {activeTab === 'delete' && showConfirmation && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">
                  Êtes-vous vraiment sûr de vouloir supprimer cette candidature ?
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-4 border-t border-[var(--border-color)]">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--input-bg)] transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'delete'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {activeTab === 'delete' ? (
                    <>
                      {showConfirmation ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Confirmer
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Rejeter
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DeleteConfirmationModal;
