import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Eye, Save as SaveIcon, Trash2, ChevronDown, ChevronUp, FileText, GraduationCap, Briefcase, Clock, DollarSign, Download, Heart, Bookmark, StickyNote } from 'lucide-react';
import { MatchingPercentage } from './MatchingPercentage';
import { ComparisonTable, MatchItem } from './ComparisonTable';
import { Label, DEFAULT_LABELS } from '../hooks/useSavedCandidates';
import { CandidateNotes } from './CandidateNotes';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

// Candidate status types
export type CandidateStatus = 'Nouveau' | 'En cours' | 'Archivé' | 'Rejeté';

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
  formData?: CandidateFormData;
  matchPercentage?: number;
  matchItems?: MatchItem[];
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const statusColors = getStatusColors(candidate.status);
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  // Default form data if not provided
  const formData = candidate.formData || {
    skills: ['React', 'TypeScript', 'Node.js', 'JavaScript'],
    experienceLevel: '3 ans',
    education: 'Master en Informatique',
    availability: 'Immédiate',
    salaryExpectations: '45 000€ - 55 000€',
    coverLetter: 'Lettre de motivation standard...',
    cvFileName: 'cv_mohamed_el_amrani.pdf',
  };

  // Default match items if not provided
  const matchItems: MatchItem[] = candidate.matchItems || [
    { requirement: 'React', candidateProfile: 'React', matchPercentage: 100, status: 'matched' },
    { requirement: 'Node.js', candidateProfile: 'Node.js', matchPercentage: 100, status: 'matched' },
    { requirement: 'TypeScript', candidateProfile: 'TypeScript', matchPercentage: 100, status: 'matched' },
    { requirement: '5+ ans expérience', candidateProfile: '3 ans', matchPercentage: 60, status: 'partial' },
    { requirement: 'MongoDB', candidateProfile: 'PostgreSQL', matchPercentage: 50, status: 'partial' },
    { requirement: 'AWS', candidateProfile: 'Non spécifié', matchPercentage: 0, status: 'missing' },
  ];

  const matchPercentage = candidate.matchPercentage || 72;

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
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                {candidate.status}
              </span>
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

      {/* Postuler Info */}
      <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-purple-400">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          Candidature soumise
        </div>
      </div>

      {/* Matching Percentage */}
      <div className="mb-4 p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
        <MatchingPercentage percentage={matchPercentage} showCircular={true} size="sm" />
      </div>

      {/* Candidate Form Data */}
      <div className="mb-4 space-y-3">
        <h4 className="font-medium text-[var(--text-primary)] text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-500" />
          Données du candidat
        </h4>
        
        {/* CV */}
        <div className="flex items-center justify-between p-2 bg-[var(--bg-main)] rounded-lg">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <FileText className="w-4 h-4 text-purple-500" />
            <span>CV</span>
          </div>
          {formData.cvFileName ? (
            <button className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
              <Download className="w-3 h-3" />
              {formData.cvFileName}
            </button>
          ) : (
            <span className="text-xs text-[var(--text-secondary)]">Non fourni</span>
          )}
        </div>

        {/* Skills */}
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
            <Briefcase className="w-4 h-4 text-purple-500" />
            <span>Compétences</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {formData.skills.map((skill, index) => (
              <SkillTag key={index} skill={skill} />
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Briefcase className="w-4 h-4 text-purple-500" />
            <span>Expérience</span>
          </div>
          <span className="text-[var(--text-primary)]">{formData.experienceLevel}</span>
        </div>

        {/* Education */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <span>Formation</span>
          </div>
          <span className="text-[var(--text-primary)]">{formData.education}</span>
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Disponibilité</span>
          </div>
          <span className="text-[var(--text-primary)]">{formData.availability}</span>
        </div>

        {/* Salary Expectations */}
        {formData.salaryExpectations && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <DollarSign className="w-4 h-4 text-purple-500" />
              <span>Salaire souhaité</span>
            </div>
            <span className="text-[var(--text-primary)]">{formData.salaryExpectations}</span>
          </div>
        )}
      </div>

      {/* Toggle Analysis Button */}
      <button
        onClick={() => setShowAnalysis(!showAnalysis)}
        className="w-full flex items-center justify-between p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg hover:border-purple-500/50 transition-colors mb-4"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {showAnalysis ? 'Masquer l\'analyse détaillée' : 'Voir l\'analyse détaillée'}
        </span>
        {showAnalysis ? (
          <ChevronUp className="w-4 h-4 text-purple-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-500" />
        )}
      </button>

      {/* Detailed Analysis - Comparison Table */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showAnalysis ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-2">
          <h4 className="font-medium text-[var(--text-primary)] text-sm mb-2">
            Comparaison profil/exigences
          </h4>
          <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
            <ComparisonTable items={matchItems} showHeader={true} />
          </div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={() => {
          setShowDeleteModal(false);
          onDelete(candidate);
        }}
        onConfirmReject={(reason) => {
          setShowDeleteModal(false);
          onReject?.(candidate.id, reason);
        }}
        candidateName={fullName}
      />

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
    </div>
  );
}

export default CandidateCard;
