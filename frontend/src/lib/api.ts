// /home/manal/projet_final_BPMS/frontend/src/lib/api.ts

const API_BASE_URL = 'http://localhost:5000/api';

export interface CVData {
  name?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  [key: string]: unknown;
}

export interface JobOfferData {
  title?: string;
  requiredSkills?: string[];
  experienceRequired?: string;
  educationRequired?: string;
  [key: string]: unknown;
}

export interface AnalysisRequest {
  candidateId: string;
  jobOfferId: string;
  cvData: CVData;
  jobOfferData: JobOfferData;
}

export interface AnalysisResponse {
  success: boolean;
  cached: boolean;
  data: {
    id?: string;
    overallScore: number;
    categoryScores: {
      skills: number;
      experience: number;
      education: number;
      technicalFit: number;
    };
    matchedRequirements: string[];
    missingRequirements: string[];
    strengths: string[];
    weaknesses: string[];
    recommendation?: string;
    priority?: string;
    interviewQuestions?: string[];
    createdAt?: string;
  };
}

export async function analyzeCandidate(data: AnalysisRequest): Promise<AnalysisResponse> {
  const token = localStorage.getItem('token');
  
  console.log('🚀 Sending analysis request:', data);
  
  const response = await fetch(`${API_BASE_URL}/analyze-candidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(data)
  });

  console.log('📡 Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ API Response:', result);
  
  return result;
}

export async function getCandidate(candidateId: string) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch candidate');
  return await response.json();
}

export async function getJobOffer(jobOfferId: string) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/joboffers/${jobOfferId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch job offer');
  return await response.json();
}