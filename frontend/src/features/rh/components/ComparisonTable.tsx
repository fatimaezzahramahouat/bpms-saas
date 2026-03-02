import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

// Match item interface
export interface MatchItem {
  requirement: string;
  candidateProfile: string;
  matchPercentage: number;
  status: 'matched' | 'partial' | 'missing';
}

// Get status color
const getStatusColor = (status: MatchItem['status']): { bg: string; text: string; icon: React.ReactNode } => {
  switch (status) {
    case 'matched':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        icon: <Check className="w-4 h-4" />,
      };
    case 'partial':
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-500',
        icon: <AlertCircle className="w-4 h-4" />,
      };
    case 'missing':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        icon: <X className="w-4 h-4" />,
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-500',
        icon: <X className="w-4 h-4" />,
      };
  }
};

// Get percentage color
const getPercentageColor = (percentage: number): string => {
  if (percentage <= 30) return 'text-red-500';
  if (percentage <= 70) return 'text-yellow-500';
  return 'text-green-500';
};

interface ComparisonTableProps {
  items: MatchItem[];
  showHeader?: boolean;
}

export function ComparisonTable({ items, showHeader = true }: ComparisonTableProps) {
  return (
    <div className="w-full overflow-hidden">
      {showHeader && (
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-[var(--card-bg)] border-b border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]">
          <div className="col-span-4">Exigences du poste</div>
          <div className="col-span-4">Profil du candidat</div>
          <div className="col-span-2 text-center">Match</div>
          <div className="col-span-2 text-center">Statut</div>
        </div>
      )}

      <div className="divide-y divide-[var(--border-color)]">
        {items.map((item, index) => {
          const statusColors = getStatusColor(item.status);
          
          return (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 px-4 py-3 bg-[var(--bg-main)] hover:bg-[var(--card-bg)] transition-colors"
            >
              {/* Requirement */}
              <div className="col-span-4 flex items-center">
                <span className="text-sm text-[var(--text-primary)]">{item.requirement}</span>
              </div>

              {/* Candidate Profile */}
              <div className="col-span-4 flex items-center">
                <span className="text-sm text-[var(--text-secondary)]">{item.candidateProfile}</span>
              </div>

              {/* Match Percentage */}
              <div className="col-span-2 flex items-center justify-center">
                <span className={`text-sm font-semibold ${getPercentageColor(item.matchPercentage)}`}>
                  {item.matchPercentage}%
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center justify-center">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                  {statusColors.icon}
                  {item.status === 'matched' && 'Match'}
                  {item.status === 'partial' && 'Partiel'}
                  {item.status === 'missing' && 'Manquant'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-[var(--card-bg)] border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">Score global</span>
          <div className="flex items-center gap-2">
            {items.filter(i => i.status === 'matched').length > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Check className="w-3 h-3" />
                {items.filter(i => i.status === 'matched').length} matché(s)
              </span>
            )}
            {items.filter(i => i.status === 'partial').length > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <AlertCircle className="w-3 h-3" />
                {items.filter(i => i.status === 'partial').length} partiel(s)
              </span>
            )}
            {items.filter(i => i.status === 'missing').length > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <X className="w-3 h-3" />
                {items.filter(i => i.status === 'missing').length} manquant(s)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonTable;
