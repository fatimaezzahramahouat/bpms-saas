import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// Map frontend display status to backend Prisma enum
export type CandidateStatusDisplay = 'Nouveau' | 'En cours' | 'Archivé' | 'Rejeté';

const statusToPrisma: Record<CandidateStatusDisplay, string> = {
  'Nouveau': 'CANDIDATE',
  'En cours': 'CONTACTED',
  'Archivé': 'ACCEPTED',
  'Rejeté': 'REJECTED'
};

const prismaToStatus: Record<string, CandidateStatusDisplay> = {
  'CANDIDATE': 'Nouveau',
  'CONTACTED': 'En cours',
  'INTERVIEW': 'En cours',
  'ACCEPTED': 'Archivé',
  'REJECTED': 'Rejeté'
};

interface StatusDropdownProps {
  candidateId: string;
  currentStatus: CandidateStatusDisplay;
  onStatusChange?: (newStatus: CandidateStatusDisplay) => void;
}

const statusConfig: Record<CandidateStatusDisplay, { 
  color: string; 
  label: string; 
  icon: string; 
  dotColor: string;
  bgColor: string;
}> = {
  'Nouveau': { 
    color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
    label: 'Nouveau',
    icon: '🆕',
    dotColor: 'bg-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  'En cours': { 
    color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
    label: 'En cours',
    icon: '⏳',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  'Archivé': { 
    color: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
    label: 'Archivé',
    icon: '📁',
    dotColor: 'bg-gray-500',
    bgColor: 'bg-gray-500/10'
  },
  'Rejeté': { 
    color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
    label: 'Rejeté',
    icon: '❌',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-500/10'
  }
};

export function StatusDropdown({ candidateId, currentStatus, onStatusChange }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: CandidateStatusDisplay) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    console.log('🔄 [StatusDropdown] Attempting to update status:', {
      candidateId,
      from: currentStatus,
      to: newStatus,
      mappedStatus: statusToPrisma[newStatus]
    });

    setIsUpdating(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      console.log('📤 [StatusDropdown] Sending request to:', `${API_URL}/api/candidates/${candidateId}/status`);
      console.log('📤 [StatusDropdown] Request body:', JSON.stringify({ status: statusToPrisma[newStatus] }));
      
      const response = await fetch(`${API_URL}/api/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ status: statusToPrisma[newStatus] })
      });

      console.log('📥 [StatusDropdown] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [StatusDropdown] Update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update status');
      }

      const data = await response.json();
      console.log('📥 [StatusDropdown] Response data:', data);
      console.log('✅ [StatusDropdown] Status updated successfully');
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      
      // Wait a moment to ensure database is updated before reloading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload page to update counts
      window.location.reload();
      
    } catch (error) {
      console.error('❌ [StatusDropdown] Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const currentConfig = statusConfig[currentStatus];
  const statusOptions: CandidateStatusDisplay[] = ['Nouveau', 'En cours', 'Archivé', 'Rejeté'];

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${currentConfig.color} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`w-2 h-2 rounded-full ${currentConfig.dotColor}`}></span>
        {isUpdating ? 'Mise à jour...' : currentConfig.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card-bg)] rounded-lg shadow-lg border border-[var(--border-color)] py-1 z-20">
            <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)] mb-1">
              Changer le statut
            </div>
            
            {statusOptions.map((status) => {
              const config = statusConfig[status];
              const isSelected = status === currentStatus;
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating}
                  className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-[var(--bg-main)] transition-colors ${isSelected ? 'bg-[var(--bg-main)]' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                  <span className="flex-1 text-left text-sm text-[var(--text-primary)]">
                    {config.icon} {config.label}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
