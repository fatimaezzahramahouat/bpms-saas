/**
 * Utility functions for formatting data in the RH module
 */

/**
 * Format date to French locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format relative time (e.g., "il y a 2 jours")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) {
        return 'À l\'instant';
      }
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  }
  if (diffDays === 1) {
    return 'Hier';
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Il y a ${months} mois`;
  }
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
}

/**
 * Format phone number to French format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as French phone number
  if (digits.length === 10) {
    return `+33 ${digits.slice(1, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  
  if (digits.length === 12 && digits.startsWith('212')) {
    const number = digits.slice(3);
    return `+212 ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 6)} ${number.slice(6, 8)}`;
  }
  
  return phone;
}

/**
 * Format salary expectations
 */
export function formatSalary(salary: string): string {
  // Extract numbers from salary string
  const numbers = salary.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return salary;
  }
  
  const formatted = numbers.map(num => {
    const parsed = parseInt(num, 10);
    return parsed.toLocaleString('fr-FR');
  });
  
  // Replace numbers in original string with formatted ones
  let result = salary;
  formatted.forEach(f => {
    result = result.replace(/\d+/, f);
  });
  
  return result;
}

/**
 * Format match percentage with color class
 */
export function formatMatchPercentage(percentage: number): {
  value: number;
  label: string;
  colorClass: string;
  bgClass: string;
} {
  let label: string;
  let colorClass: string;
  let bgClass: string;
  
  if (percentage >= 80) {
    label = 'Excellent';
    colorClass = 'text-green-500';
    bgClass = 'bg-green-500';
  } else if (percentage >= 60) {
    label = 'Bon';
    colorClass = 'text-blue-500';
    bgClass = 'bg-blue-500';
  } else if (percentage >= 40) {
    label = 'Moyen';
    colorClass = 'text-yellow-500';
    bgClass = 'bg-yellow-500';
  } else {
    label = 'Faible';
    colorClass = 'text-red-500';
    bgClass = 'bg-red-500';
  }
  
  return { value: percentage, label, colorClass, bgClass };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Octets';
  
  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format candidate name
 */
export function formatCandidateName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

/**
 * Format job offer title
 */
export function formatJobTitle(title: string): string {
  return title;
}

/**
 * Format department name
 */
export function formatDepartment(department: string): string {
  return department;
}

/**
 * Get status label in French
 */
export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'Nouveau': 'Nouveau',
    'En cours': 'En cours de traitement',
    'Archivé': 'Archivé',
    'Rejeté': 'Rejeté',
    'Accepté': 'Accepté',
    'Interview': 'En entretien',
    'Offre': 'Offre envoyée'
  };
  
  return statusMap[status] || status;
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format number with thousand separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR');
}
