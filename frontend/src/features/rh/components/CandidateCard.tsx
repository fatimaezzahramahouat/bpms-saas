import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Eye, Save as SaveIcon, Trash2, ChevronDown, ChevronUp, FileText, Download, Heart, StickyNote, X } from 'lucide-react';
import { MatchingPercentage } from './MatchingPercentage';
import { ComparisonTable, MatchItem } from './ComparisonTable';
import { Label, DEFAULT_LABELS } from '../hooks/useSavedCandidates';
import { CandidateNotes } from './CandidateNotes';
import { StatusDropdown } from './StatusDropdown';
import { ConfirmModal } from '@/components/ConfirmModal';

// Get API URL for static file serving
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Candidate status types
export type CandidateStatus = 'Nouveau' | 'En cours' | 'Archivé' | 'Rejeté';

// AI Analysis interface
export interface AIAnalysis {
  id: string;
  overallScore: number;
  result?: any;
  confidence?: number;
  matchedSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: string;
  priority?: string;
  interviewQuestions?: string[];
}

// Candidate form data interface
export interface CandidateFormData {
  cvUrl?: string;
  cvFileName?: string;
  coverLetter?: string;
  skills: string[];
  experienceLevel: string;
  education: string;
  availability: string;
  salaryExpectations?: string;
}

// Candidate interface
export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appliedDate: string;
  status: CandidateStatus;
  jobOfferId: string;
  cv?: string;  // Direct CV path from candidate.cv field
  formData?: CandidateFormData;
  matchPercentage?: number;
  matchItems?: MatchItem[];
  aiAnalysis?: AIAnalysis;
}

// Status badge colors based on status
const getStatusColors = (status: CandidateStatus): { bg: string; text: string; dot: string } => {
  switch (status) {
    case 'Nouveau':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        dot: 'bg-blue-400',
      };
    case 'En cours':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        dot: 'bg-purple-400',
      };
    case 'Archivé':
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        dot: 'bg-gray-400',
      };
    case 'Rejeté':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        dot: 'bg-red-400',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        dot: 'bg-gray-400',
      };
  }
};

// Format date to French locale
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Skill tag component
function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium">
      {skill}
    </span>
  );
}

// Candidate Card Component
interface CandidateCardProps {
  candidate: Candidate;
  onViewAnalysis: (candidate: Candidate) => void;
  onSave: (candidate: Candidate) => void;
  onDelete: (candidate: Candidate) => void;
  jobRequirements?: string[];
  onViewCV?: (candidate: Candidate) => void;
  isSaved?: boolean;
  savedLabels?: string[];
  savedNotes?: Array<{ id: string; content: string; createdAt: string; updatedAt: string }>;
  onToggleSave?: (candidateId: string) => void;
  onAddLabel?: (candidateId: string, label: Label) => void;
  onRemoveLabel?: (candidateId: string, labelId: string) => void;
  onAddNote?: (candidateId: string, content: string) => void;
  onUpdateNote?: (candidateId: string, noteId: string, content: string) => void;
  onDeleteNote?: (candidateId: string, noteId: string) => void;
  onReject?: (candidateId: string, reason?: string) => void;
}

export function CandidateCard({ 
  candidate, 
  onViewAnalysis, 
  onSave, 
  onDelete, 
  jobRequirements = [], 
  onViewCV,
  isSaved = false, 
  savedLabels = [], 
  savedNotes = [],
  onToggleSave,
  onAddLabel,
  onRemoveLabel,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onReject
}: CandidateCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showCvModal, setShowCvModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const statusColors = getStatusColors(candidate.status);
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  // Default form data if not provided
  const formData = candidate.formData;
  const matchPercentage = candidate.matchPercentage || 0;
  const matchItems: MatchItem[] = candidate.matchItems || [];

  // Build CV URL - use full backend URL for static file serving
  const getCvUrl = (): string => {
    // First try formData.cvFileName
    if (formData?.cvFileName && formData.cvFileName !== 'cv.pdf') {
      const fileName = formData.cvFileName;
      // If already a full URL, use it directly
      if (fileName.startsWith('http')) {
        return fileName;
      }
      // Use full backend URL to access static files
      return `${API_URL}/uploads/cvs/${fileName}`;
    }
    
    // Fallback: check if candidate has direct cv path (from candidate.cv field)
    if (candidate.cv) {
      const cvPath = candidate.cv;
      if (cvPath.startsWith('http')) {
        return cvPath;
      }
      // If path starts with /uploads, prepend API_URL
      if (cvPath.startsWith('/uploads')) {
        return `${API_URL}${cvPath}`;
      }
      return `${API_URL}/uploads/cvs/${cvPath}`;
    }
    
    return '';
  };

  const cvUrl = getCvUrl();

  // Handle download click
  const handleDownloadCV = () => {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header - Name and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {candidate.firstName.charAt(0).toUpperCase()}
            {candidate.lastName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-lg">{fullName}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusDropdown 
                candidateId={candidate.id}
                currentStatus={candidate.status || 'Nouveau'}
                onStatusChange={(newStatus) => {
                  console.log('Status changed to:', newStatus);
                }}
              />
              {/* Saved Labels */}
              {savedLabels.length > 0 && (
                <div className="flex gap-1">
                  {savedLabels.map((labelId) => {
                    const label = DEFAULT_LABELS.find((l) => l.id === labelId);
                    if (!label) return null;
                    return (
                      <span
                        key={labelId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${label.color}20`, color: label.color }}
                      >
                        {label.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <Mail className="w-4 h-4 text-purple-500" />
          <a href={`mailto:${candidate.email}`} className="text-sm hover:text-purple-400 transition-colors">
            {candidate.email}
          </a>
        </div>
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <Phone className="w-4 h-4 text-purple-500" />
          <a href={`tel:${candidate.phone}`} className="text-sm hover:text-purple-400 transition-colors">
            {candidate.phone}
          </a>
        </div>
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <Calendar className="w-4 h-4 text-purple-500" />
          <span className="text-sm">
            Candidature du {formatDate(candidate.appliedDate)}
          </span>
        </div>
      </div>

      {/* Matching Percentage */}
      <div className="mb-4 p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
        <MatchingPercentage percentage={matchPercentage} showCircular={true} size="sm" />
      </div>

      {/* Candidate Form Data - CV only */}
      <div className="mb-4 space-y-3">
        {/* CV - clickable */}
        <div 
          className="flex items-center justify-between p-2 bg-[var(--bg-main)] rounded-lg cursor-pointer hover:bg-purple-500/10 transition-colors"
          onClick={() => cvUrl && setShowCvModal(true)}
        >
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <FileText className="w-4 h-4 text-purple-500" />
            <span>CV</span>
          </div>
          {formData?.cvFileName ? (
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <Download className="w-3 h-3" />
              <span className="max-w-[150px] truncate">{formData.cvFileName}</span>
            </div>
          ) : (
            <span className="text-xs text-[var(--text-secondary)]">Non fourni</span>
          )}
        </div>
      </div>

  

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)]">
        <Link
          to={`/dashboard/rh/candidates/${candidate.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
        >
          <Eye className="w-4 h-4" />
          Voir analyse
        </Link>
        <button
          onClick={() => onToggleSave?.(candidate.id)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isSaved
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10'
          }`}
          title={isSaved ? 'Retirer des sauvegardés' : 'Sauvegarder'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            showNotes
              ? 'bg-yellow-500/10 text-yellow-500'
              : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-yellow-400 hover:bg-yellow-500/10'
          }`}
          title="Notes"
        >
          <StickyNote className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 bg-[var(--input-bg)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 rounded-lg transition-all duration-200"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="pt-3 border-t border-[var(--border-color)]">
          <CandidateNotes
            notes={savedNotes}
            onAddNote={(content) => onAddNote?.(candidate.id, content)}
            onUpdateNote={(noteId, content) => onUpdateNote?.(candidate.id, noteId, content)}
            onDeleteNote={(noteId) => onDeleteNote?.(candidate.id, noteId)}
          />
        </div>
      )}

      {/* CV Modal */}
      {showCvModal && cvUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCvModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl h-[80vh] bg-[var(--card-bg)] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-[var(--text-primary)]">
                  CV - {fullName}
                </h3>
              </div>
              <button
                onClick={() => setShowCvModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {cvUrl ? (
                <object
                  data={cvUrl}
                  type="application/pdf"
                  className="w-full h-full"
                  title={`CV - ${fullName}`}
                >
                  {/* Fallback for browsers that don't support object tag */}
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <FileText className="w-16 h-16 text-purple-500 mb-4" />
                    <p className="text-[var(--text-secondary)] mb-4">
                      Votre navigateur ne peut pas afficher le PDF directement.
                    </p>
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                      Ouvrir dans un nouvel onglet
                    </a>
                  </div>
                </object>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[var(--text-secondary)]">CV non disponible</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--border-color)]">
              <button
                onClick={handleDownloadCV}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
              <button
                onClick={() => setShowCvModal(false)}
                className="px-4 py-2 bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete?.(candidate);
        }}
        title="⚠️ Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce candidat? Cette action est irréversible et toutes les données associées seront perdues."
        confirmText="Supprimer"
        cancelText="Annuler"
        candidateName={fullName}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default CandidateCard;
