import { Candidate, CandidateStatus } from '../components/CandidateCard';
import { formatDate, formatPhoneNumber, formatSalary } from './formatters';

/**
 * Export candidates to CSV format
 */
export function exportCandidatesToCSV(
  candidates: Candidate[],
  jobOfferTitle: string
): void {
  // Define CSV headers
  const headers = [
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Date de candidature',
    'Statut',
    'Score de correspondance',
    'Compétences',
    'Niveau d\'expérience',
    'Formation',
    'Disponibilité',
    'Attentes salariales',
  ];

  // Map candidates to CSV rows
  const rows = candidates.map((candidate) => [
    candidate.lastName,
    candidate.firstName,
    candidate.email,
    candidate.phone,
    formatDate(candidate.appliedDate),
    candidate.status,
    `${candidate.matchPercentage}%`,
    candidate.formData?.skills?.join('; ') || '',
    candidate.formData?.experienceLevel || '',
    candidate.formData?.education || '',
    candidate.formData?.availability || '',
    candidate.formData?.salaryExpectations || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape cells containing commas, quotes, or newlines
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ),
  ].join('\n');

  // Add BOM for Excel to properly handle UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `candidatures_${jobOfferTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export candidate analysis to PDF format (simplified HTML-based)
 * Note: For production, consider using a library like jsPDF or react-pdf
 */
export function exportAnalysisToPDF(
  candidate: Candidate,
  jobRequirements: {
    title: string;
    requiredSkills: string[];
    requiredExperience: string;
    requiredEducation: string;
  },
  analysisResult?: string
): void {
  // Create HTML content for PDF
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Analyse - ${candidate.firstName} ${candidate.lastName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #6b21a8; border-bottom: 2px solid #6b21a8; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .candidate-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { font-weight: bold; width: 150px; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-tag { background: #e5e7eb; padding: 4px 12px; border-radius: 16px; font-size: 14px; }
    .score-box { 
      background: ${candidate.matchPercentage >= 60 ? '#dcfce7' : '#fef3c7'};
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .score-value { font-size: 36px; font-weight: bold; color: ${candidate.matchPercentage >= 60 ? '#16a34a' : '#d97706'}; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>Analyse de Candidature</h1>
  
  <div class="score-box">
    <div>Score de correspondance</div>
    <div class="score-value">${candidate.matchPercentage}%</div>
  </div>

  <h2>Informations du candidat</h2>
  <div class="candidate-info">
    <div class="info-row"><span class="info-label">Nom:</span> ${candidate.lastName}</div>
    <div class="info-row"><span class="info-label">Prénom:</span> ${candidate.firstName}</div>
    <div class="info-row"><span class="info-label">Email:</span> ${candidate.email}</div>
    <div class="info-row"><span class="info-label">Téléphone:</span> ${candidate.phone}</div>
    <div class="info-row"><span class="info-label">Date de candidature:</span> ${formatDate(candidate.appliedDate)}</div>
    <div class="info-row"><span class="info-label">Statut:</span> ${candidate.status}</div>
  </div>

  <h2>Profil professionnel</h2>
  <div class="candidate-info">
    <div class="info-row"><span class="info-label">Expérience:</span> ${candidate.formData?.experienceLevel || 'Non spécifié'}</div>
    <div class="info-row"><span class="info-label">Formation:</span> ${candidate.formData?.education || 'Non spécifié'}</div>
    <div class="info-row"><span class="info-label">Disponibilité:</span> ${candidate.formData?.availability || 'Non spécifié'}</div>
    <div class="info-row"><span class="info-label">Salaire:</span> ${candidate.formData?.salaryExpectations || 'Non spécifié'}</div>
  </div>

  <h2>Compétences</h2>
  <div class="skills-list">
    ${(candidate.formData?.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
  </div>

  <h2>Requirements du poste</h2>
  <div class="candidate-info">
    <div class="info-row"><span class="info-label">Poste:</span> ${jobRequirements.title}</div>
    <div class="info-row"><span class="info-label">Expérience:</span> ${jobRequirements.requiredExperience}</div>
    <div class="info-row"><span class="info-label">Formation:</span> ${jobRequirements.requiredEducation}</div>
  </div>

  <h2>Compétences requises</h2>
  <div class="skills-list">
    ${jobRequirements.requiredSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
  </div>

  ${analysisResult ? `
  <h2>Analyse IA</h2>
  <div class="candidate-info">
    <p>${analysisResult}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p>© NexFlow - Système de gestion des candidatures</p>
  </div>
</body>
</html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `analyse_${candidate.firstName}_${candidate.lastName}_${new Date().toISOString().split('T')[0]}.html`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate shareable candidate link
 */
export function generateShareableLink(candidateId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/dashboard/rh/candidate/${candidateId}/share`;
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Print candidate profile
 */
export function printCandidateProfile(): void {
  window.print();
}
