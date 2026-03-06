// /home/manal/projet_final_BPMS/frontend/src/shared/services/jobOffer.service.ts
import { API_BASE_URL } from '../constants';

export interface BackendJobOffer {
  id: string;
  title: string;
  description: string;
  contractType: string;
  level: string;
  workMode: string;
  skills: string[];
  responsibilities: string[];
  budget: number | null;
  createdAt: string;
  organisation: {
    name: string;
    orgInfo: {
      city: string | null;
      logo: string | null;
    } | null;
  };
}

export interface JobOffer {
  id: string | number;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  postedDate: string;
  skills?: string[];
  budget?: string;
  deadline?: string;
  experienceLevel?: string;
  responsibilities?: string[];
  workMode?: string;
}

export interface JobOfferQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  contractType?: string;
  city?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const mapBackendToFrontend = (job: BackendJobOffer): JobOffer => {
  const levelMap: Record<string, string> = {
    'JUNIOR': 'Junior',
    'MID': 'Intermediate',
    'SENIOR': 'Senior',
    'LEAD': 'Lead',
    'INTERN': 'Intern'
  };

  return {
    id: job.id,
    title: job.title,
    company: job.organisation.name,
    location: job.organisation.orgInfo?.city || 'Remote',
    type: job.contractType,
    description: job.description,
    postedDate: new Date(job.createdAt).toLocaleDateString(),
    skills: job.skills,
    budget: job.budget ? `${job.budget} MAD/mois` : undefined,
    experienceLevel: levelMap[job.level] || job.level,
    responsibilities: job.responsibilities,
    workMode: job.workMode,
  };
};

export const jobOfferService = {
  async getPublicOffers(params: JobOfferQueryParams): Promise<PaginatedResponse<JobOffer>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.contractType) query.append('contractType', params.contractType);
    if (params.city) query.append('city', params.city);

    // ✅ Get token from localStorage
    const token = localStorage.getItem('token');
    
    console.log('🔍 [getPublicOffers] Token:', token ? token.substring(0, 30) + '...' : 'NULL');

    // ✅ Send request with Authorization header if token exists
    const response = await fetch(`${API_BASE_URL}/joboffers?${query.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('📡 [getPublicOffers] Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, errorText);
      
      // Optional: Handle 401 for auto-logout
      if (response.status === 401) {
        console.log('⚠️ Token invalid - consider logging out');
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      }
      
      throw new Error(`Failed to fetch job offers: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform backend pagination to expected meta structure
    return {
      data: result.data.map(mapBackendToFrontend),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
};