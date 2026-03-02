import api from './api';

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  contractType: string;
  level: string;
  workMode: string;
  skills: string[];
  responsibilities: string[];
  budget?: number | null;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  createdAt: string;
  organisationId: string;
  createdById: string;
  applicationsCount?: number;
  _count?: {
    applications: number;
  };
}

export interface JobOfferFilters {
  page?: number;
  limit?: number;
  search?: string;
  contractType?: string;
  city?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const jobOfferService = {
  /**
   * Fetch job offers for the authenticated RH organisation
   */
  async getRHOffers(params: JobOfferFilters = {}): Promise<PaginatedResponse<JobOffer>> {
    const response = await api.get('/joboffers/rh', { params });
    return response.data;
  },

  /**
   * Create a new job offer
   */
  async createOffer(data: Partial<JobOffer>): Promise<{ message: string; data: JobOffer }> {
    const response = await api.post('/joboffers/rh', data);
    return response.data;
  },

  /**
   * Update an existing job offer
   */
  async updateOffer(id: string, data: Partial<JobOffer>): Promise<{ message: string; data: JobOffer }> {
    const response = await api.put(`/joboffers/rh/${id}`, data);
    return response.data;
  },

  /**
   * Delete a job offer
   */
  async deleteOffer(id: string): Promise<void> {
    await api.delete(`/joboffers/rh/${id}`);
  },

  /**
   * Get a job offer by ID
   */
  async getOfferById(id: string): Promise<{ data: JobOffer }> {
    const response = await api.get(`/joboffers/${id}`);
    return response.data;
  },

  /**
   * Get candidates for a specific job offer
   */
  async getJobCandidates(id: string): Promise<{ data: any[] }> {
    const response = await api.get(`/joboffers/rh/${id}/candidates`);
    return response.data;
  }
};
