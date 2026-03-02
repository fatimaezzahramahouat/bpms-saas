import { API_BASE_URL } from '../../../shared/constants';

export interface CandidateStatistics {
  // Overview Stats
  totalCandidates: number;
  averageMatchScore: number;
  newToday: number;
  savedCandidates: number;
  totalCandidatesTrend: number;
  
  // Status Distribution
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  
  // Match Score Distribution
  scoreDistribution: {
    range: string;
    min: number;
    max: number;
    count: number;
    color: string;
  }[];
  
  // Top Skills
  topSkills: {
    skill: string;
    count: number;
    percentage: number;
  }[];
  
  // Application Timeline
  applicationTimeline: {
    date: string;
    count: number;
  }[];
  
  // Conversion Funnel
  conversionFunnel: {
    stage: string;
    count: number;
    percentage: number;
  }[];
}

export const candidateStatisticsService = {
  async getStatistics(): Promise<CandidateStatistics> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/candidates/statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch candidate statistics');
    }

    const result = await response.json();
    return result.data;
  },
};
